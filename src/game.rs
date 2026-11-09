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
    pub round_elapsed_seconds: u32,
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
            round_elapsed_seconds: 0,
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

    pub fn reconnect_or_add_player(
        &mut self,
        existing_id: Option<&str>,
        player_name: String,
        avatar: String,
    ) -> String {
        if let Some(pid) = existing_id {
            if let Some(player) = self.players.iter_mut().find(|p| p.id == pid) {
                player.connected = true;
                player.name = player_name;
                player.avatar = avatar;
                return pid.to_string();
            }
        }

        if let Some(player) = self
            .players
            .iter_mut()
            .find(|p| p.name == player_name && !p.is_bot && !p.connected)
        {
            player.connected = true;
            player.avatar = avatar;
            return player.id.clone();
        }

        self.add_player(player_name, avatar)
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
        self.round_elapsed_seconds = 0;

        for p in &mut self.players {
            p.current_answers.clear();
            p.basta_called = false;
        }

        // Generate bot answers in background
        let cats = self.settings.categories.clone();
        let lang_mode = self.settings.language_mode.clone();
        for p in &mut self.players {
            if p.is_bot {
                p.current_answers = generate_bot_answers(letter, &cats, &lang_mode);
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

            // Count occurrences of words starting with the letter
            let mut word_counts: HashMap<String, usize> = HashMap::new();
            let mut valid_player_count = 0;

            for (_pid, raw, norm) in &player_answers {
                if !norm.is_empty() && starts_with_letter(raw, letter) {
                    let is_dict = Dictionary::is_valid_word(
                        cat_id,
                        raw,
                        letter,
                        &self.settings.language_mode,
                    );
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
                let in_dict = has_word
                    && Dictionary::is_valid_word(
                        cat_id,
                        &raw,
                        letter,
                        &self.settings.language_mode,
                    );
                let count =
                    if has_word && matches_letter && (in_dict || cat_id.starts_with("custom_")) {
                        *word_counts.get(&norm).unwrap_or(&1)
                    } else {
                        1
                    };

                let (mut status, mut points) = if !has_word {
                    ("empty".to_string(), 0)
                } else if !matches_letter {
                    ("wrong_letter".to_string(), 0)
                } else if !in_dict && !cat_id.starts_with("custom_") {
                    // Non-dictionary gibberish (e.g. "fff") receives 0 points!
                    ("invalid".to_string(), 0)
                } else if count == 2 {
                    // 50 points if 2 persons have the same word
                    ("duplicate".to_string(), 50)
                } else if count == 3 {
                    // 25 points if 3 persons have the same word
                    ("duplicate".to_string(), 25)
                } else if count >= 4 {
                    // 10 points for 4 or more persons
                    ("duplicate".to_string(), 10)
                } else if valid_player_count == 1
                    && self.players.len() > 1
                    && self.settings.bonus_sole_answer
                {
                    ("sole_survivor".to_string(), 200)
                } else {
                    // 100 points if 1 person
                    ("valid".to_string(), 100)
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

                // If negative approvals, reject; if approved, grant points
                if approvals < 0 {
                    status = "rejected".to_string();
                    points = 0;
                } else if approvals > 0 && status == "invalid" {
                    status = "valid".to_string();
                    points = if count == 2 {
                        50
                    } else if count == 3 {
                        25
                    } else if count >= 4 {
                        10
                    } else {
                        100
                    };
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

    #[test]
    fn test_repeated_word_lower_score_and_bilingual_dictionary() {
        let settings = GameSettings {
            language_mode: crate::models::LanguageMode::Both,
            ..GameSettings::default()
        };
        let mut room = Room::new("BASTA3".to_string(), settings);

        let p1 = room.add_player("Alice".to_string(), "👩".to_string());
        let p2 = room.add_player("Bob".to_string(), "👨".to_string());

        assert!(room.start_game().is_ok());
        room.current_letter = Some('A');

        // Both write the exact same word "Apple" (English word, repeated!)
        room.submit_field(&p1, "fruta_comida", "Apple");
        room.submit_field(&p2, "fruta_comida", "Apple");

        // p1 writes "Alligator" (English), p2 writes "Águila" (Spanish) - both valid, non-repeated!
        room.submit_field(&p1, "animal", "Alligator");
        room.submit_field(&p2, "animal", "Águila");

        room.call_basta(&p1).unwrap();
        room.trigger_review();

        let review = room.latest_round_review.as_ref().unwrap();
        let p1_evals = &review.evaluations[&p1];
        let p2_evals = &review.evaluations[&p2];

        // Repeated word "Apple" must get lower score (50 pts)!
        assert_eq!(p1_evals["fruta_comida"].points, 50);
        assert_eq!(p1_evals["fruta_comida"].status, "duplicate");
        assert_eq!(p2_evals["fruta_comida"].points, 50);
        assert_eq!(p2_evals["fruta_comida"].status, "duplicate");

        // Unique English and Spanish words must get 100 pts!
        assert_eq!(p1_evals["animal"].points, 100);
        assert_eq!(p1_evals["animal"].status, "valid");
        assert_eq!(p2_evals["animal"].points, 100);
        assert_eq!(p2_evals["animal"].status, "valid");
    }

    #[test]
    fn test_gibberish_rejection_fuzzy_matching_and_tiered_scoring() {
        let settings = GameSettings {
            language_mode: crate::models::LanguageMode::Both,
            ..GameSettings::default()
        };
        let mut room = Room::new("BASTA4".to_string(), settings);

        let p1 = room.add_player("P1".to_string(), "👩".to_string());
        let p2 = room.add_player("P2".to_string(), "👨".to_string());
        let p3 = room.add_player("P3".to_string(), "🧒".to_string());
        let p4 = room.add_player("P4".to_string(), "👧".to_string());

        assert!(room.start_game().is_ok());
        room.current_letter = Some('F');

        // P1 writes gibberish "fff" -> must be rejected with 0 points!
        room.submit_field(&p1, "fruta_comida", "fff");

        // P2 writes typo "freza" (distance 1 to "fresa") -> must fuzzy match and be accepted!
        room.submit_field(&p2, "fruta_comida", "freza");

        // P1, P2, P3 write the exact same valid word "Foca" -> 3 persons = 25 pts each!
        room.submit_field(&p1, "animal", "Foca");
        room.submit_field(&p2, "animal", "Foca");
        room.submit_field(&p3, "animal", "Foca");
        // P4 writes distinct valid animal "Falcon" -> 100 pts!
        room.submit_field(&p4, "animal", "Falcon");

        // 4 persons write the exact same word "Francia" -> 4+ persons = 10 pts each!
        room.submit_field(&p1, "pais_ciudad", "Francia");
        room.submit_field(&p2, "pais_ciudad", "Francia");
        room.submit_field(&p3, "pais_ciudad", "Francia");
        room.submit_field(&p4, "pais_ciudad", "Francia");

        room.call_basta(&p1).unwrap();
        room.trigger_review();

        let review = room.latest_round_review.as_ref().unwrap();

        // 1. Gibberish "fff" gets 0 points!
        assert_eq!(review.evaluations[&p1]["fruta_comida"].points, 0);
        assert_eq!(review.evaluations[&p1]["fruta_comida"].status, "invalid");

        // 2. Fuzzy match "freza" gets points!
        assert!(review.evaluations[&p2]["fruta_comida"].points > 0);

        // 3. 3 persons with same word ("Foca") -> 25 points each!
        assert_eq!(review.evaluations[&p1]["animal"].points, 25);
        assert_eq!(review.evaluations[&p2]["animal"].points, 25);
        assert_eq!(review.evaluations[&p3]["animal"].points, 25);
        assert_eq!(review.evaluations[&p4]["animal"].points, 100);

        // 4. 4 persons with same word ("Francia") -> 10 points each!
        assert_eq!(review.evaluations[&p1]["pais_ciudad"].points, 10);
        assert_eq!(review.evaluations[&p2]["pais_ciudad"].points, 10);
        assert_eq!(review.evaluations[&p3]["pais_ciudad"].points, 10);
        assert_eq!(review.evaluations[&p4]["pais_ciudad"].points, 10);
    }

    #[test]
    fn test_armando_vs_amanda_and_no_armario_false_match() {
        let settings = GameSettings {
            language_mode: crate::models::LanguageMode::Both,
            ..GameSettings::default()
        };
        let mut room = Room::new("BASTA5".to_string(), settings);

        let p1 = room.add_player("P1".to_string(), "👩".to_string());
        let p2 = room.add_player("P2".to_string(), "👨".to_string());

        assert!(room.start_game().is_ok());
        room.current_letter = Some('A');

        // P1 writes Armando, P2 writes Amanda -> distinct valid names, each gets 100 points!
        room.submit_field(&p1, "nombre", "Armando");
        room.submit_field(&p2, "nombre", "Amanda");

        // P1 writes "armando" in cosa_objeto -> must NOT match "armario"! Receives 0 points!
        room.submit_field(&p1, "cosa_objeto", "armando");

        room.call_basta(&p1).unwrap();
        room.trigger_review();

        let review = room.latest_round_review.as_ref().unwrap();

        // Armando and Amanda are NOT duplicates:
        assert_eq!(review.evaluations[&p1]["nombre"].points, 100);
        assert_eq!(review.evaluations[&p1]["nombre"].status, "valid");
        assert_eq!(review.evaluations[&p2]["nombre"].points, 100);
        assert_eq!(review.evaluations[&p2]["nombre"].status, "valid");

        // "armando" in cosa_objeto is rejected (0 points):
        assert_eq!(review.evaluations[&p1]["cosa_objeto"].points, 0);
        assert_eq!(review.evaluations[&p1]["cosa_objeto"].status, "invalid");
    }

    #[test]
    fn test_cobija_and_expanded_vocabulary() {
        use crate::dictionary::Dictionary;
        use crate::models::LanguageMode;

        // "cobija" and "cobijas" in Spanish cosa_objeto must be valid!
        assert!(Dictionary::is_valid_word(
            "cosa_objeto",
            "cobija",
            'C',
            &LanguageMode::Spanish
        ));
        assert!(Dictionary::is_valid_word(
            "cosa_objeto",
            "cobijas",
            'C',
            &LanguageMode::Spanish
        ));
        assert!(Dictionary::is_valid_word(
            "cosa_objeto",
            "cobertor",
            'C',
            &LanguageMode::Spanish
        ));
        assert!(Dictionary::is_valid_word(
            "cosa_objeto",
            "colchón",
            'C',
            &LanguageMode::Spanish
        ));
        assert!(Dictionary::is_valid_word(
            "cosa_objeto",
            "colchon",
            'C',
            &LanguageMode::Spanish
        ));
        assert!(Dictionary::is_valid_word(
            "cosa_objeto",
            "almohada",
            'A',
            &LanguageMode::Spanish
        ));

        // In game room:
        let settings = GameSettings {
            language_mode: LanguageMode::Spanish,
            ..GameSettings::default()
        };
        let mut room = Room::new("BASTA6".to_string(), settings);
        let p1 = room.add_player("P1".to_string(), "🤠".to_string());
        room.start_game().unwrap();
        room.current_letter = Some('C');
        room.submit_field(&p1, "cosa_objeto", "cobija");
        room.call_basta(&p1).unwrap();
        room.trigger_review();

        let review = room.latest_round_review.as_ref().unwrap();
        assert_eq!(review.evaluations[&p1]["cosa_objeto"].points, 100);
        assert_eq!(review.evaluations[&p1]["cosa_objeto"].status, "valid");
    }

    #[test]
    fn test_reconnect_preserves_player_slot_and_score() {
        let mut room = Room::new("RECON1".to_string(), GameSettings::default());
        let p1_id = room.add_player("Carlos".to_string(), "🤠".to_string());
        room.players[0].total_score = 350;

        // Disconnect Carlos (like closing tab or refresh)
        room.players[0].connected = false;
        assert_eq!(room.players.len(), 1);

        // Reconnect with same player_id
        let recon_id =
            room.reconnect_or_add_player(Some(&p1_id), "Carlos".to_string(), "🤠".to_string());
        assert_eq!(recon_id, p1_id);
        assert_eq!(room.players.len(), 1);
        assert!(room.players[0].connected);
        assert_eq!(room.players[0].total_score, 350);

        // Disconnect again and reconnect by name
        room.players[0].connected = false;
        let recon_name_id =
            room.reconnect_or_add_player(None, "Carlos".to_string(), "🤠".to_string());
        assert_eq!(recon_name_id, p1_id);
        assert_eq!(room.players.len(), 1);
        assert!(room.players[0].connected);
    }
}
