use crate::bots::{create_bot_player, generate_bot_answers};
use crate::dictionary::{normalize_str, starts_with_letter, Dictionary};
use crate::models::{
    AnswerEvaluation, GamePhase, GameSettings, Player, RoomStateView, RoundScore, ServerMessage,
};
use rand::prelude::*;
use std::collections::HashMap;
use tokio::sync::mpsc::UnboundedSender;

pub struct Room {
    pub room_code: String,
    pub phase: GamePhase,
    pub current_round: u32,
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
    pub subscribers: HashMap<String, UnboundedSender<ServerMessage>>,
}

impl Room {
    pub fn new(room_code: String, settings: GameSettings) -> Self {
        Self {
            room_code,
            phase: GamePhase::Lobby,
            current_round: 0,
            current_letter: None,
            used_letters: Vec::new(),
            countdown_remaining: None,
            review_remaining: None,
            caller_id: None,
            caller_name: None,
            players: Vec::new(),
            settings,
            latest_round_review: None,
            history: Vec::new(),
            subscribers: HashMap::new(),
        }
    }

    pub fn add_player(&mut self, player_name: String, avatar: String) -> String {
        let player_id = format!("usr_{}", rand::rng().random_range(100000..999999));
        let is_host = self.players.is_empty();

        let player = Player {
            id: player_id.clone(),
            name: player_name,
            avatar,
            is_host,
            is_bot: false,
            total_score: 0,
            current_answers: HashMap::new(),
            basta_called: false,
            connected: true,
        };

        self.players.push(player);
        player_id
    }

    pub fn add_bot(&mut self, personality: Option<String>) -> Option<String> {
        if self.players.len() >= 12 {
            return None;
        }
        let index = self.players.iter().filter(|p| p.is_bot).count();
        let (bot, _pers) = create_bot_player(index, personality.as_deref());
        let bot_id = bot.id.clone();
        self.players.push(bot);
        Some(bot_id)
    }

    pub fn remove_player(&mut self, player_id: &str) {
        if let Some(pos) = self.players.iter().position(|p| p.id == player_id) {
            let was_host = self.players[pos].is_host;
            self.players.remove(pos);
            self.subscribers.remove(player_id);

            // Reassign host if needed
            if was_host && !self.players.is_empty() {
                if let Some(human) = self.players.iter_mut().find(|p| !p.is_bot) {
                    human.is_host = true;
                } else {
                    self.players[0].is_host = true;
                }
            }
        }
    }

    pub fn get_available_letters(&self) -> Vec<char> {
        let standard_letters = [
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'L', 'M', 'N', 'O', 'P', 'R', 'S',
            'T', 'U', 'V',
        ];
        let difficult_letters = ['K', 'Q', 'W', 'X', 'Y', 'Z'];

        let mut available = Vec::new();
        for &ch in standard_letters.iter() {
            if !self.used_letters.contains(&ch) {
                available.push(ch);
            }
        }
        if self.settings.allow_difficult_letters {
            for &ch in difficult_letters.iter() {
                if !self.used_letters.contains(&ch) {
                    available.push(ch);
                }
            }
        }

        if available.is_empty() {
            // Reset if all letters exhausted
            standard_letters.to_vec()
        } else {
            available
        }
    }

    pub fn start_game(&mut self) -> Result<(), &'static str> {
        if self.players.is_empty() {
            return Err("No hay jugadores en la sala");
        }
        self.current_round = 1;
        self.used_letters.clear();
        self.history.clear();
        for p in &mut self.players {
            p.total_score = 0;
            p.current_answers.clear();
            p.basta_called = false;
        }

        self.start_round();
        Ok(())
    }

    pub fn start_round(&mut self) {
        let available = self.get_available_letters();
        let mut rng = rand::rng();
        let letter = available[rng.random_range(0..available.len())];
        self.current_letter = Some(letter);
        self.used_letters.push(letter);
        self.phase = GamePhase::Playing;
        self.countdown_remaining = None;
        self.review_remaining = None;
        self.caller_id = None;
        self.caller_name = None;

        for p in &mut self.players {
            p.current_answers.clear();
            p.basta_called = false;
        }

        // Generate bot answers in background
        let cats = self.settings.categories.clone();
        for p in &mut self.players {
            if p.is_bot {
                p.current_answers = generate_bot_answers(letter, &cats);
            }
        }
    }

    pub fn submit_field(&mut self, player_id: &str, category_id: &str, text: &str) {
        if self.phase != GamePhase::Playing && self.phase != GamePhase::BastaCountdown {
            return;
        }
        if let Some(player) = self.players.iter_mut().find(|p| p.id == player_id) {
            player
                .current_answers
                .insert(category_id.to_string(), text.trim().to_string());
        }
    }

    pub fn submit_all(&mut self, player_id: &str, answers: HashMap<String, String>) {
        if self.phase != GamePhase::Playing && self.phase != GamePhase::BastaCountdown {
            return;
        }
        if let Some(player) = self.players.iter_mut().find(|p| p.id == player_id) {
            for (k, v) in answers {
                player.current_answers.insert(k, v.trim().to_string());
            }
        }
    }

    pub fn call_basta(&mut self, player_id: &str) -> Result<String, &'static str> {
        if self.phase != GamePhase::Playing {
            return Err("Solo se puede llamar Basta durante el juego activo");
        }

        let caller_name = if let Some(player) = self.players.iter_mut().find(|p| p.id == player_id)
        {
            player.basta_called = true;
            player.name.clone()
        } else {
            return Err("Jugador no encontrado");
        };

        self.phase = GamePhase::BastaCountdown;
        self.caller_id = Some(player_id.to_string());
        self.caller_name = Some(caller_name.clone());
        self.countdown_remaining = Some(self.settings.countdown_seconds);

        Ok(caller_name)
    }

    pub fn trigger_review(&mut self) {
        self.phase = GamePhase::Reviewing;
        self.countdown_remaining = None;
        self.review_remaining = Some(self.settings.review_duration_seconds);

        self.evaluate_current_round();
    }

    pub fn evaluate_current_round(&mut self) {
        let letter = match self.current_letter {
            Some(l) => l,
            None => return,
        };

        let mut evaluations: HashMap<String, HashMap<String, AnswerEvaluation>> = HashMap::new();
        for p in &self.players {
            evaluations.insert(p.id.clone(), HashMap::new());
        }

        // For each category, inspect all player answers
        for cat in &self.settings.categories {
            let cat_id = &cat.id;

            // Collect player answers
            let mut player_answers: Vec<(String, String, String)> = Vec::new(); // (player_id, raw_word, norm_word)
            for p in &self.players {
                let raw = p.current_answers.get(cat_id).cloned().unwrap_or_default();
                let norm = normalize_str(&raw);
                player_answers.push((p.id.clone(), raw, norm));
            }

            // Count occurrences of valid words
            let mut word_counts: HashMap<String, usize> = HashMap::new();
            let mut valid_player_count = 0;

            for (_pid, raw, norm) in &player_answers {
                if !norm.is_empty() && starts_with_letter(raw, letter) {
                    let is_dict = Dictionary::is_valid_word(cat_id, raw, letter);
                    // If it starts with letter and is either in dict or custom category
                    if is_dict || cat_id.starts_with("custom_") {
                        *word_counts.entry(norm.clone()).or_insert(0) += 1;
                        valid_player_count += 1;
                    }
                }
            }

            // Assign status & points
            for (pid, raw, norm) in player_answers {
                let has_word = !norm.is_empty();
                let matches_letter = has_word && starts_with_letter(&raw, letter);
                let in_dict = has_word && Dictionary::is_valid_word(cat_id, &raw, letter);

                let (mut status, mut points) = if !has_word {
                    ("empty".to_string(), 0)
                } else if !matches_letter {
                    ("wrong_letter".to_string(), 0)
                } else if !in_dict && !cat_id.starts_with("custom_") {
                    // For custom categories or disputed words, start provisional
                    ("disputed".to_string(), 100)
                } else {
                    let count = *word_counts.get(&norm).unwrap_or(&1);
                    if count > 1 {
                        ("duplicate".to_string(), 50)
                    } else if valid_player_count == 1
                        && self.players.len() > 1
                        && self.settings.bonus_sole_answer
                    {
                        ("sole_survivor".to_string(), 200)
                    } else {
                        ("valid".to_string(), 100)
                    }
                };

                // Preserve existing approvals if any
                let (approvals, voters) = if let Some(prev) = &self.latest_round_review {
                    if let Some(prev_p) = prev.evaluations.get(&pid) {
                        if let Some(prev_e) = prev_p.get(cat_id) {
                            (prev_e.approvals, prev_e.voters.clone())
                        } else {
                            (0, HashMap::new())
                        }
                    } else {
                        (0, HashMap::new())
                    }
                } else {
                    (0, HashMap::new())
                };

                // If negative approvals, reject
                if approvals < 0 {
                    status = "rejected".to_string();
                    points = 0;
                }

                let eval = AnswerEvaluation {
                    word: raw,
                    is_valid_letter: matches_letter,
                    is_valid_dict: in_dict,
                    approvals,
                    voters,
                    points,
                    status,
                };

                evaluations
                    .get_mut(&pid)
                    .unwrap()
                    .insert(cat_id.clone(), eval);
            }
        }

        // Calculate sum of points per player for this round
        let mut round_points: HashMap<String, u32> = HashMap::new();
        for (pid, cat_map) in &evaluations {
            let total: u32 = cat_map.values().map(|e| e.points).sum();
            round_points.insert(pid.clone(), total);
        }

        self.latest_round_review = Some(RoundScore {
            round_number: self.current_round,
            letter,
            caller_id: self.caller_id.clone(),
            caller_name: self.caller_name.clone(),
            round_points,
            evaluations,
        });
    }

    pub fn vote_answer(
        &mut self,
        voter_id: &str,
        target_player_id: &str,
        category_id: &str,
        approve: bool,
    ) {
        if self.phase != GamePhase::Reviewing {
            return;
        }

        if let Some(review) = &mut self.latest_round_review {
            if let Some(player_evals) = review.evaluations.get_mut(target_player_id) {
                if let Some(eval) = player_evals.get_mut(category_id) {
                    let vote_val = if approve { 1 } else { -1 };
                    let prev_val = eval
                        .voters
                        .insert(voter_id.to_string(), vote_val)
                        .unwrap_or(0);
                    eval.approvals += (vote_val - prev_val) as i32;

                    if eval.approvals < 0 {
                        eval.status = "rejected".to_string();
                        eval.points = 0;
                    } else if eval.status == "rejected" {
                        eval.status = "valid".to_string();
                        eval.points = 100;
                    }
                }
            }

            // Recompute player round points
            let mut round_points: HashMap<String, u32> = HashMap::new();
            for (pid, cat_map) in &review.evaluations {
                let total: u32 = cat_map.values().map(|e| e.points).sum();
                round_points.insert(pid.clone(), total);
            }
            review.round_points = round_points;
        }
    }

    pub fn finish_round_and_next(&mut self) {
        if let Some(review) = &self.latest_round_review {
            for p in &mut self.players {
                if let Some(&pts) = review.round_points.get(&p.id) {
                    p.total_score += pts;
                }
            }
            self.history.push(review.clone());
        }

        if self.current_round >= self.settings.rounds_count {
            self.phase = GamePhase::GameOver;
        } else {
            self.current_round += 1;
            self.start_round();
        }
    }

    pub fn state_view(&self) -> RoomStateView {
        RoomStateView {
            room_code: self.room_code.clone(),
            phase: self.phase.clone(),
            current_round: self.current_round,
            total_rounds: self.settings.rounds_count,
            current_letter: self.current_letter,
            used_letters: self.used_letters.clone(),
            countdown_remaining: self.countdown_remaining,
            review_remaining: self.review_remaining,
            caller_id: self.caller_id.clone(),
            caller_name: self.caller_name.clone(),
            players: self.players.clone(),
            settings: self.settings.clone(),
            latest_round_review: self.latest_round_review.clone(),
            history: self.history.clone(),
        }
    }

    pub fn broadcast(&self, msg: ServerMessage) {
        for tx in self.subscribers.values() {
            let _ = tx.send(msg.clone());
        }
    }

    pub fn broadcast_state(&self) {
        let state_view = self.state_view();
        self.broadcast(ServerMessage::State(Box::new(state_view)));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_room_initialization_and_player_add() {
        let mut room = Room::new("BASTA1".to_string(), GameSettings::default());
        let _p1 = room.add_player("Carlos".to_string(), "🤠".to_string());
        assert_eq!(room.players.len(), 1);
        assert!(room.players[0].is_host);

        let _p2 = room.add_player("Ana".to_string(), "👩".to_string());
        assert_eq!(room.players.len(), 2);
        assert!(!room.players[1].is_host);

        room.add_bot(None);
        assert_eq!(room.players.len(), 3);
        assert!(room.players[2].is_bot);
    }

    #[test]
    fn test_game_progression_and_scoring() {
        let mut room = Room::new("BASTA2".to_string(), GameSettings::default());
        let p1 = room.add_player("Elena".to_string(), "👩".to_string());
        let p2 = room.add_player("Mario".to_string(), "👨".to_string());

        assert!(room.start_game().is_ok());
        assert_eq!(room.phase, GamePhase::Playing);
        let letter = room.current_letter.unwrap();

        // Submit answers for 'animal'
        let p1_animal = if letter == 'G' { "Gato" } else { "Animal" };
        let p2_animal = if letter == 'G' { "Gorila" } else { "Animal" };

        room.submit_field(&p1, "animal", p1_animal);
        room.submit_field(&p2, "animal", p2_animal);

        assert!(room.call_basta(&p1).is_ok());
        assert_eq!(room.phase, GamePhase::BastaCountdown);

        room.trigger_review();
        assert_eq!(room.phase, GamePhase::Reviewing);
        assert!(room.latest_round_review.is_some());

        room.finish_round_and_next();
        assert_eq!(room.current_round, 2);
    }
}
