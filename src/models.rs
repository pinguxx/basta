use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum GamePhase {
    Lobby,
    LetterSpin,
    Playing,
    BastaCountdown,
    Reviewing,
    GameOver,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub description: String,
}

impl Category {
    pub fn new(id: &str, name: &str, icon: &str, desc: &str) -> Self {
        Self {
            id: id.to_string(),
            name: name.to_string(),
            icon: icon.to_string(),
            description: desc.to_string(),
        }
    }
}

pub fn default_categories() -> Vec<Category> {
    vec![
        Category::new("nombre", "Nombre", "👤", "Nombre de persona"),
        Category::new("apellido", "Apellido", "📜", "Apellido común o hispano"),
        Category::new(
            "pais_ciudad",
            "País o Ciudad",
            "🌎",
            "País, capital, estado o ciudad",
        ),
        Category::new("animal", "Animal", "🐾", "Cualquier animal o especie"),
        Category::new(
            "fruta_comida",
            "Fruta o Alimento",
            "🥑",
            "Fruta, verdura, platillo o bebida",
        ),
        Category::new(
            "cosa_objeto",
            "Cosa u Objeto",
            "📦",
            "Objeto cotidiano, herramienta o cosa",
        ),
        Category::new("color", "Color", "🎨", "Color o tonalidad"),
        Category::new(
            "flor_planta",
            "Flor o Planta",
            "🌻",
            "Flor, árbol, planta o hierba",
        ),
    ]
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum LanguageMode {
    #[serde(rename = "both")]
    Both,
    #[serde(rename = "es")]
    Spanish,
    #[serde(rename = "en")]
    English,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct GameSettings {
    pub categories: Vec<Category>,
    pub rounds_count: u32,
    pub countdown_seconds: u32,
    pub review_duration_seconds: u32,
    pub allow_difficult_letters: bool,
    pub bonus_sole_answer: bool,
    pub language_mode: LanguageMode,
}

impl Default for GameSettings {
    fn default() -> Self {
        Self {
            categories: default_categories(),
            rounds_count: 5,
            countdown_seconds: 10,
            review_duration_seconds: 35,
            allow_difficult_letters: false,
            bonus_sole_answer: true,
            language_mode: LanguageMode::Both,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Player {
    pub id: String,
    pub name: String,
    pub avatar: String,
    pub is_host: bool,
    pub is_bot: bool,
    pub total_score: u32,
    pub current_answers: HashMap<String, String>,
    pub basta_called: bool,
    pub connected: bool,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum EvaluationStatus {
    Valid,
    Duplicate,
    Disputed,
    Rejected,
    Empty,
    SoleSurvivor,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnswerEvaluation {
    pub word: String,
    pub is_valid_letter: bool,
    pub is_valid_dict: bool,
    pub approvals: i32,              // upvotes - downvotes
    pub voters: HashMap<String, i8>, // voter_player_id -> +1 or -1
    pub points: u32,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoundScore {
    pub round_number: u32,
    pub letter: char,
    pub caller_id: Option<String>,
    pub caller_name: Option<String>,
    pub round_points: HashMap<String, u32>,
    pub evaluations: HashMap<String, HashMap<String, AnswerEvaluation>>, // player_id -> category_id -> eval
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoomStateView {
    pub room_code: String,
    pub phase: GamePhase,
    pub current_round: u32,
    pub total_rounds: u32,
    pub current_letter: Option<char>,
    pub used_letters: Vec<char>,
    pub countdown_remaining: Option<u32>,
    pub review_remaining: Option<u32>,
    pub caller_id: Option<String>,
    pub caller_name: Option<String>,
    pub players: Vec<Player>,
    pub settings: GameSettings,
    pub latest_round_review: Option<RoundScore>,
    pub history: Vec<RoundScore>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ClientMessage {
    #[serde(rename = "join")]
    Join { player_name: String, avatar: String },
    #[serde(rename = "update_settings")]
    UpdateSettings { settings: GameSettings },
    #[serde(rename = "add_bot")]
    AddBot { personality: Option<String> },
    #[serde(rename = "remove_player")]
    RemovePlayer { player_id: String },
    #[serde(rename = "start_game")]
    StartGame,
    #[serde(rename = "submit_field")]
    SubmitField { category_id: String, text: String },
    #[serde(rename = "submit_all")]
    SubmitAll { answers: HashMap<String, String> },
    #[serde(rename = "call_basta")]
    CallBasta,
    #[serde(rename = "vote_answer")]
    VoteAnswer {
        target_player_id: String,
        category_id: String,
        approve: bool,
    },
    #[serde(rename = "next_round")]
    NextRound,
    #[serde(rename = "restart_game")]
    RestartGame,
    #[serde(rename = "send_quip")]
    SendQuip { message: String },
    #[serde(rename = "ping")]
    Ping,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ServerMessage {
    #[serde(rename = "state")]
    State(Box<RoomStateView>),
    #[serde(rename = "basta_triggered")]
    BastaTriggered {
        caller_id: String,
        caller_name: String,
        seconds_remaining: u32,
    },
    #[serde(rename = "timer_tick")]
    TimerTick {
        phase: GamePhase,
        seconds_remaining: u32,
    },
    #[serde(rename = "chat_quip")]
    ChatQuip {
        player_name: String,
        avatar: String,
        message: String,
    },
    #[serde(rename = "error")]
    Error { message: String },
    #[serde(rename = "pong")]
    Pong,
}
