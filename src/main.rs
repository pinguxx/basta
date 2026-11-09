mod bots;
mod dictionary;
mod game;
mod models;

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    http::StatusCode,
    response::{Html, IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use futures_util::{SinkExt, StreamExt};
use game::Room;
use models::{ClientMessage, GamePhase, GameSettings, ServerMessage};
use rand::prelude::*;
use serde::Deserialize;
use std::{collections::HashMap, net::SocketAddr, sync::Arc, time::Duration};
use tokio::sync::{mpsc, RwLock};
use tower_http::services::ServeDir;

type RoomMap = Arc<RwLock<HashMap<String, Arc<RwLock<Room>>>>>;

#[derive(Clone)]
struct AppState {
    rooms: RoomMap,
}

#[derive(Debug, Deserialize)]
struct WsQuery {
    room: Option<String>,
    player_id: Option<String>,
    name: Option<String>,
    avatar: Option<String>,
}

#[tokio::main]
async fn main() {
    let port = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(3000);

    let state = AppState {
        rooms: Arc::new(RwLock::new(HashMap::new())),
    };

    // Start background ticker for countdowns and bot behavior
    let ticker_state = state.clone();
    tokio::spawn(async move {
        run_game_ticker(ticker_state).await;
    });

    let app = Router::new()
        .route("/healthz", get(healthz_handler))
        .route("/api/rooms/new", post(create_room_handler))
        .route("/ws", get(ws_handler))
        .fallback_service(
            ServeDir::new("public").not_found_service(axum::routing::get(fallback_index_handler)),
        )
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("🚀 Basta Mexicano Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Failed to bind port");

    axum::serve(listener, app).await.expect("Server failed");
}

async fn healthz_handler() -> &'static str {
    "OK"
}

async fn fallback_index_handler() -> impl IntoResponse {
    match tokio::fs::read_to_string("public/index.html").await {
        Ok(content) => Html(content).into_response(),
        Err(_) => (StatusCode::NOT_FOUND, "index.html not found").into_response(),
    }
}

async fn create_room_handler(
    State(state): State<AppState>,
    body: Option<Json<GameSettings>>,
) -> Json<serde_json::Value> {
    let room_code = generate_room_code();
    let game_settings = body.map(|b| b.0).unwrap_or_default();
    let room = Arc::new(RwLock::new(Room::new(room_code.clone(), game_settings)));

    let mut rooms = state.rooms.write().await;
    rooms.insert(room_code.clone(), room);

    Json(serde_json::json!({
        "success": true,
        "room_code": room_code,
    }))
}

fn generate_room_code() -> String {
    let chars: Vec<char> = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".chars().collect();
    let mut rng = rand::rng();
    (0..6)
        .map(|_| chars[rng.random_range(0..chars.len())])
        .collect()
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(query): Query<WsQuery>,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, query, state))
}

async fn handle_socket(socket: WebSocket, query: WsQuery, state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<ServerMessage>();

    // Forward outbound messages from channel to WebSocket
    tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if let Ok(json) = serde_json::to_string(&msg) {
                if sender.send(Message::Text(json.into())).await.is_err() {
                    break;
                }
            }
        }
    });

    let mut current_room_code = query.room.clone();
    let mut current_player_id = query.player_id.clone();

    // Auto-join if params are present in query
    if let (Some(code), Some(name)) = (&current_room_code, &query.name) {
        let trimmed_name = name.trim();
        if trimmed_name.is_empty() {
            let _ = tx.send(ServerMessage::Error {
                message: "Por favor ingresa tu nombre para jugar".to_string(),
            });
        } else {
            let avatar = query.avatar.clone().unwrap_or_else(|| "🤠".to_string());
            let room_opt = {
                let mut rooms = state.rooms.write().await;
                if !rooms.contains_key(code) {
                    let new_room = Arc::new(RwLock::new(Room::new(
                        code.clone(),
                        GameSettings::default(),
                    )));
                    rooms.insert(code.clone(), new_room);
                }
                rooms.get(code).cloned()
            };

            if let Some(room_arc) = room_opt {
                let mut room = room_arc.write().await;
                let pid = room.add_player(trimmed_name.to_string(), avatar);
                room.subscribers.insert(pid.clone(), tx.clone());
                current_player_id = Some(pid);
                room.broadcast_state();
            }
        }
    }

    // Process incoming client messages
    while let Some(Ok(msg)) = receiver.next().await {
        let text = match msg {
            Message::Text(t) => t.to_string(),
            Message::Close(_) => break,
            _ => continue,
        };

        let client_msg: ClientMessage = match serde_json::from_str(&text) {
            Ok(m) => m,
            Err(_) => continue,
        };

        match client_msg {
            ClientMessage::Join {
                player_name,
                avatar,
            } => {
                let trimmed = player_name.trim();
                if trimmed.is_empty() {
                    let _ = tx.send(ServerMessage::Error {
                        message: "Por favor ingresa tu nombre para jugar".to_string(),
                    });
                    continue;
                }
                let code = current_room_code.clone().unwrap_or_else(generate_room_code);
                current_room_code = Some(code.clone());

                let room_arc = {
                    let mut rooms = state.rooms.write().await;
                    rooms
                        .entry(code.clone())
                        .or_insert_with(|| {
                            Arc::new(RwLock::new(Room::new(
                                code.clone(),
                                GameSettings::default(),
                            )))
                        })
                        .clone()
                };

                let mut room = room_arc.write().await;
                let pid = room.add_player(trimmed.to_string(), avatar);
                room.subscribers.insert(pid.clone(), tx.clone());
                current_player_id = Some(pid);
                room.broadcast_state();
            }
            ClientMessage::UpdateSettings { settings } => {
                if let Some(code) = &current_room_code {
                    let rooms = state.rooms.read().await;
                    if let Some(room_arc) = rooms.get(code) {
                        let mut room = room_arc.write().await;
                        room.settings = settings;
                        room.broadcast_state();
                    }
                }
            }
            ClientMessage::AddBot { personality } => {
                if let Some(code) = &current_room_code {
                    let rooms = state.rooms.read().await;
                    if let Some(room_arc) = rooms.get(code) {
                        let mut room = room_arc.write().await;
                        room.add_bot(personality);
                        room.broadcast_state();
                    }
                }
            }
            ClientMessage::RemovePlayer { player_id } => {
                if let Some(code) = &current_room_code {
                    let rooms = state.rooms.read().await;
                    if let Some(room_arc) = rooms.get(code) {
                        let mut room = room_arc.write().await;
                        room.remove_player(&player_id);
                        room.broadcast_state();
                    }
                }
            }
            ClientMessage::StartGame => {
                if let Some(code) = &current_room_code {
                    let rooms = state.rooms.read().await;
                    if let Some(room_arc) = rooms.get(code) {
                        let mut room = room_arc.write().await;
                        if let Err(err) = room.start_game() {
                            let _ = tx.send(ServerMessage::Error {
                                message: err.to_string(),
                            });
                        } else {
                            room.broadcast_state();
                        }
                    }
                }
            }
            ClientMessage::SubmitField { category_id, text } => {
                if let (Some(code), Some(pid)) = (&current_room_code, &current_player_id) {
                    let rooms = state.rooms.read().await;
                    if let Some(room_arc) = rooms.get(code) {
                        let mut room = room_arc.write().await;
                        room.submit_field(pid, &category_id, &text);
                    }
                }
            }
            ClientMessage::SubmitAll { answers } => {
                if let (Some(code), Some(pid)) = (&current_room_code, &current_player_id) {
                    let rooms = state.rooms.read().await;
                    if let Some(room_arc) = rooms.get(code) {
                        let mut room = room_arc.write().await;
                        room.submit_all(pid, answers);
                    }
                }
            }
            ClientMessage::CallBasta => {
                if let (Some(code), Some(pid)) = (&current_room_code, &current_player_id) {
                    let rooms = state.rooms.read().await;
                    if let Some(room_arc) = rooms.get(code) {
                        let mut room = room_arc.write().await;
                        match room.call_basta(pid) {
                            Ok(caller_name) => {
                                let seconds = room.countdown_remaining.unwrap_or(10);
                                room.broadcast(ServerMessage::BastaTriggered {
                                    caller_id: pid.clone(),
                                    caller_name,
                                    seconds_remaining: seconds,
                                });
                                room.broadcast_state();
                            }
                            Err(err) => {
                                let _ = tx.send(ServerMessage::Error {
                                    message: err.to_string(),
                                });
                            }
                        }
                    }
                }
            }
            ClientMessage::VoteAnswer {
                target_player_id,
                category_id,
                approve,
            } => {
                if let (Some(code), Some(pid)) = (&current_room_code, &current_player_id) {
                    let rooms = state.rooms.read().await;
                    if let Some(room_arc) = rooms.get(code) {
                        let mut room = room_arc.write().await;
                        room.vote_answer(pid, &target_player_id, &category_id, approve);
                        room.broadcast_state();
                    }
                }
            }
            ClientMessage::NextRound => {
                if let Some(code) = &current_room_code {
                    let rooms = state.rooms.read().await;
                    if let Some(room_arc) = rooms.get(code) {
                        let mut room = room_arc.write().await;
                        room.finish_round_and_next();
                        room.broadcast_state();
                    }
                }
            }
            ClientMessage::RestartGame => {
                if let Some(code) = &current_room_code {
                    let rooms = state.rooms.read().await;
                    if let Some(room_arc) = rooms.get(code) {
                        let mut room = room_arc.write().await;
                        room.phase = GamePhase::Lobby;
                        room.current_round = 0;
                        room.current_letter = None;
                        room.history.clear();
                        room.latest_round_review = None;
                        for p in &mut room.players {
                            p.total_score = 0;
                            p.current_answers.clear();
                            p.basta_called = false;
                        }
                        room.broadcast_state();
                    }
                }
            }
            ClientMessage::SendQuip { message } => {
                if let (Some(code), Some(pid)) = (&current_room_code, &current_player_id) {
                    let rooms = state.rooms.read().await;
                    if let Some(room_arc) = rooms.get(code) {
                        let room = room_arc.read().await;
                        if let Some(player) = room.players.iter().find(|p| p.id == *pid) {
                            room.broadcast(ServerMessage::ChatQuip {
                                player_name: player.name.clone(),
                                avatar: player.avatar.clone(),
                                message,
                            });
                        }
                    }
                }
            }
            ClientMessage::Ping => {
                let _ = tx.send(ServerMessage::Pong);
            }
        }
    }

    // Cleanup on disconnect
    if let (Some(code), Some(pid)) = (current_room_code, current_player_id) {
        let rooms = state.rooms.read().await;
        if let Some(room_arc) = rooms.get(&code) {
            let mut room = room_arc.write().await;
            room.subscribers.remove(&pid);
            if let Some(p) = room.players.iter_mut().find(|p| p.id == pid) {
                p.connected = false;
            }
            room.broadcast_state();
        }
    }
}

async fn run_game_ticker(state: AppState) {
    let mut interval = tokio::time::interval(Duration::from_secs(1));
    loop {
        interval.tick().await;

        let room_arcs: Vec<Arc<RwLock<Room>>> = {
            let rooms = state.rooms.read().await;
            rooms.values().cloned().collect()
        };

        for room_arc in room_arcs {
            let mut room = room_arc.write().await;

            match room.phase {
                GamePhase::BastaCountdown => {
                    let remaining = room.countdown_remaining.unwrap_or(0);
                    if remaining <= 1 {
                        room.trigger_review();
                        room.broadcast_state();
                    } else {
                        let next = remaining - 1;
                        room.countdown_remaining = Some(next);
                        room.broadcast(ServerMessage::TimerTick {
                            phase: GamePhase::BastaCountdown,
                            seconds_remaining: next,
                        });
                    }
                }
                GamePhase::Reviewing => {
                    let remaining = room.review_remaining.unwrap_or(0);
                    if remaining <= 1 {
                        room.finish_round_and_next();
                        room.broadcast_state();
                    } else {
                        let next = remaining - 1;
                        room.review_remaining = Some(next);
                        room.broadcast(ServerMessage::TimerTick {
                            phase: GamePhase::Reviewing,
                            seconds_remaining: next,
                        });
                    }
                }
                GamePhase::Playing => {
                    room.round_elapsed_seconds += 1;
                    // Bots wait at least 45 seconds before considering calling basta,
                    // ensuring human players have ample time to write their answers without feeling rushed!
                    let has_bots = room.players.iter().any(|p| p.is_bot);
                    if has_bots && room.round_elapsed_seconds >= 45 {
                        let mut rng = rand::rng();
                        // 4% chance per second once 45 seconds have passed (typical round: 45-65 seconds)
                        if rng.random_bool(0.04) {
                            if let Some(bot) = room
                                .players
                                .iter()
                                .find(|p| p.is_bot && !p.current_answers.is_empty())
                            {
                                let bot_id = bot.id.clone();
                                if let Ok(caller_name) = room.call_basta(&bot_id) {
                                    let seconds = room.countdown_remaining.unwrap_or(10);
                                    room.broadcast(ServerMessage::BastaTriggered {
                                        caller_id: bot_id,
                                        caller_name,
                                        seconds_remaining: seconds,
                                    });
                                    room.broadcast_state();
                                }
                            }
                        }
                    }
                }
                _ => {}
            }
        }
    }
}
