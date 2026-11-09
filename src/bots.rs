use crate::dictionary::Dictionary;
use crate::models::Player;
use rand::prelude::*;
use std::collections::HashMap;

#[allow(dead_code)]
#[derive(Debug, Clone)]
pub struct BotPersonality {
    pub name: &'static str,
    pub avatar: &'static str,
    pub speed_tier: u32, // 1 (fast), 2 (medium), 3 (relaxed)
    pub quips_on_start: &'static [&'static str],
    pub quips_on_basta: &'static [&'static str],
    pub quips_on_review: &'static [&'static str],
}

pub static BOT_PERSONALITIES: [BotPersonality; 6] = [
    BotPersonality {
        name: "🤖 El Chavo",
        avatar: "🧢",
        speed_tier: 2,
        quips_on_start: &[
            "¡Al cabo que ni quería empezar tarde!",
            "¡Zas, zas, y que yo era el más rápido con el lápiz!",
            "¡Ojalá salga la T de torta de jamón!",
        ],
        quips_on_basta: &[
            "¡Basta para mí, basta para todos, zas, zas!",
            "¡Fue sin querer queriendo!",
            "¡Ya acabé toditito!",
        ],
        quips_on_review: &[
            "¡Se me chispoteó pero sí vale!",
            "¡Bueno, pero no se enoje!",
            "¡Es que no me tienen paciencia!",
        ],
    },
    BotPersonality {
        name: "🤖 Don Ramón",
        avatar: "🤠",
        speed_tier: 3,
        quips_on_start: &[
            "¡Yo le voy al Necaxa!",
            "A ver con qué letra me salen hoy...",
            "¡No hay trabajo malo, lo malo es tener que jugar bajo presión!",
        ],
        quips_on_basta: &[
            "¡Basta! ¡Y no te doy otra nomás porque tengo que calificar!",
            "¡Alto el lápiz! ¿Qué pasó, qué pasó, vamos ahí?",
            "¡Basta, caray! A ver quién me discute mis respuestas.",
        ],
        quips_on_review: &[
            "¡Esa palabra es de mis tiempos, sí existe!",
            "¡Con permisito dijo Monchito!",
            "¡Esa me la enseñaron en el barrio!",
        ],
    },
    BotPersonality {
        name: "🤖 La Chilindrina",
        avatar: "👧",
        speed_tier: 1,
        quips_on_start: &[
            "¡Fíjate, fíjate, fíjate que voy a ganar!",
            "¡Nadie mire mi hoja o le digo a mi papá!",
            "¡Uy, facilísima esta letra!",
        ],
        quips_on_basta: &[
            "¡¡BASTA!! ¡¡BASTA 1, BASTA 2, BASTA 10!!",
            "¡Gané, gané! ¡Lápiz quieto todos!",
            "¡Waaaa, les gané a todos!",
        ],
        quips_on_review: &[
            "¡La mía es súper válida y original!",
            "¡Papáaa, me quieren cancelar mi punto!",
            "¡Fíjate que mi maestra de la escuela dijo que sí se vale!",
        ],
    },
    BotPersonality {
        name: "🤖 Quico",
        avatar: "⚓",
        speed_tier: 2,
        quips_on_start: &[
            "¡Mi mami me compró pluma de oro para jugar Basta!",
            "¡No me simpatizan!",
            "¡Ustedes no saben palabras de alcurnia como yo!",
        ],
        quips_on_basta: &[
            "¡Basta! ¡Cállate, cállate que me desesperas!",
            "¡Ya llené todo con palabras finas!",
            "¡Basta! ¡Acúsalo con tu mamá!",
        ],
        quips_on_review: &[
            "¡Claro que existe, la inventó un conde!",
            "¡Pónganme 100 puntos o le digo a mi mami!",
            "¡Chusma, chusma, pfft!",
        ],
    },
    BotPersonality {
        name: "🤖 Cantinflas",
        avatar: "🎭",
        speed_tier: 2,
        quips_on_start: &[
            "¡Ahí está el detalle! Que ni es lo uno ni es lo otro...",
            "¡Estamos aquí porque no estamos en otra parte, marchante!",
            "¡A ver qué sale con esta respetable consonante!",
        ],
        quips_on_basta: &[
            "¡Basta, joven! Porque lo que es justo es legal y lo legal no se discute.",
            "¡Momento! ¡Alto al lápiz y firmeza a la doctrina!",
            "¡Basta para la concurrencia!",
        ],
        quips_on_review: &[
            "¡No que no, chato! ¡Diccionario de pura cepa!",
            "¡Usted me habla en términos que ni yo mismo comprendo pero apoyo!",
            "¡Palabra de caballero!",
        ],
    },
    BotPersonality {
        name: "🤖 El Santo",
        avatar: "🦸‍♂️",
        speed_tier: 1,
        quips_on_start: &[
            "¡El Enmascarado de Plata listo para la batalla de palabras!",
            "¡Sin trampas en el ring del cuaderno!",
            "¡Que ruede la letra!",
        ],
        quips_on_basta: &[
            "¡¡BASTA!! ¡Cuenta de tres en el cuadrilátero!",
            "¡Alto el fuego! ¡Victoria de plata!",
            "¡Llave al cuello del tiempo: ¡BASTA!",
        ],
        quips_on_review: &[
            "¡Palabra limpia y con honor!",
            "¡Puntos justos para todos los contendientes!",
            "¡Seguimos invictos!",
        ],
    },
];

pub fn create_bot_player(
    index: usize,
    personality_name: Option<&str>,
) -> (Player, &'static BotPersonality) {
    let personality = if let Some(p_name) = personality_name {
        BOT_PERSONALITIES
            .iter()
            .find(|p| p.name == p_name)
            .unwrap_or(&BOT_PERSONALITIES[index % BOT_PERSONALITIES.len()])
    } else {
        &BOT_PERSONALITIES[index % BOT_PERSONALITIES.len()]
    };

    let bot_id = format!("bot_{}_{}", index + 1, rand::rng().random_range(1000..9999));
    let player = Player {
        id: bot_id,
        name: personality.name.to_string(),
        avatar: personality.avatar.to_string(),
        is_host: false,
        is_bot: true,
        total_score: 0,
        current_answers: HashMap::new(),
        basta_called: false,
        connected: true,
    };

    (player, personality)
}

pub fn generate_bot_answers(
    letter: char,
    categories: &[crate::models::Category],
) -> HashMap<String, String> {
    let mut answers = HashMap::new();
    let mut rng = rand::rng();

    for cat in categories {
        // High chance of finding valid word, occasional miss for realistic gameplay
        if rng.random_bool(0.92) {
            if let Some(word) = Dictionary::get_bot_word(&cat.id, letter) {
                answers.insert(cat.id.clone(), word);
            }
        }
    }

    answers
}

#[allow(dead_code)]
pub fn random_quip(quips: &[&'static str]) -> &'static str {
    let mut rng = rand::rng();
    quips[rng.random_range(0..quips.len())]
}
