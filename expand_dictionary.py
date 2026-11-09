#!/usr/bin/env python3
"""
Comprehensive dictionary expander for Basta Mexicano.
Extracts existing words, merges extensive curated Spanish and English vocabularies,
deduplicates, normalizes, and writes both:
  - src/dictionary.rs
  - public/dictionary.js
"""

import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# --- EXTRA SPANISH VOCABULARIES ---

EXTRA_ES_OBJETOS_COSAS = [
    # A
    "Ábaco", "Abanico", "Abrelatas", "Abrigo", "Abrazadera", "Aceite", "Aceitera", "Acolchado", "Acordeón", "Adaptador", 
    "Adorno", "Afilador", "Agenda", "Aguja", "Agujeta", "Alambre", "Alarma", "Albúm", "Álbum", "Alcancía", "Alfiler", 
    "Alfombra", "Alhajero", "Aljibe", "Almohada", "Almohadón", "Altavoz", "Amperímetro", "Ampolleta", "Ancla", "Andador", 
    "Andamio", "Anillo", "Anteojos", "Antena", "Antifaz", "Antorcha", "Anzuelo", "Aparador", "Aparato", "Apisonadora", 
    "Aplique", "Apuntador", "Arado", "Arandela", "Archivero", "Arco", "Arcón", "Arete", "Armadura", "Armario", "Arpón", 
    "Arracada", "Arnés", "Artesón", "Aspiradora", "Astil", "Atril", "Audífonos", "Auriculares", "Auto", "Autobús", 
    "Automóvil", "Azadón", "Azulejo",
    # B
    "Babero", "Bagaje", "Bala", "Balance", "Balanza", "Balde", "Balón", "Balsa", "Banca", "Banco", "Banda", "Bandera", 
    "Banderilla", "Banderín", "Bandeja", "Banqueta", "Baqueta", "Baraja", "Baranda", "Barba", "Barco", "Barómetro", 
    "Barra", "Barrena", "Barreno", "Barril", "Báscula", "Bastón", "Bata", "Batería", "Batidora", "Baúl", "Bayoneta", 
    "Bebedero", "Bicicleta", "Bidet", "Bidón", "Biela", "Binoculares", "Biombo", "Birrete", "Bisturí", "Bloc", "Bloque", 
    "Blusa", "Bobina", "Bocina", "Boina", "Bola", "Boleto", "Bolígrafo", "Bolo", "Bolsa", "Bolsillo", "Bolso", "Bomba", 
    "Bombilla", "Bombón", "Boquilla", "Bordado", "Borrador", "Bota", "Botas", "Bote", "Botella", "Botijo", "Botiquín", 
    "Botón", "Boya", "Brazalete", "Brida", "Broca", "Broche", "Brocha", "Brújula", "Bufanda", "Bujía", "Bulto", "Buque", 
    "Buril", "Buró", "Buzón",
    # C
    "Caballete", "Cabina", "Cable", "Cables", "Cabrestante", "Cadena", "Cadeneta", "Cacerola", "Cachucha", "Cafetera", 
    "Caja", "Cajetilla", "Cajón", "Cajonera", "Calcomanía", "Caldero", "Caldera", "Calefactor", "Calentador", "Calzado", 
    "Calzador", "Calzones", "Calzoncillos", "Cama", "Cámara", "Camarote", "Camilla", "Camión", "Camioneta", "Camisa", 
    "Camiseta", "Camisón", "Campana", "Campanilla", "Canasta", "Canastilla", "Canasto", "Candado", "Candelabro", 
    "Candelero", "Candil", "Canica", "Canoa", "Cantimplora", "Caña", "Cañón", "Capa", "Caperuza", "Capota", "Cápsula", 
    "Capucha", "Carabina", "Caramelo", "Carátula", "Carbón", "Carda", "Cargador", "Carpeta", "Carreta", "Carretel", 
    "Carretilla", "Carrito", "Carro", "Carroza", "Carrusel", "Carta", "Cartapacio", "Cartel", "Cartelera", "Cartera", 
    "Cartilla", "Cartón", "Cartuchera", "Cartucho", "Casco", "Caseta", "Casillero", "Casete", "Catalejo", "Catre", 
    "Cazadora", "Cazuela", "Cazo", "Cedazo", "Celular", "Cenicero", "Cencerro", "Cepillo", "Cepillo de dientes", 
    "Cerbatana", "Cerilla", "Cerillo", "Cerrojo", "Cesto", "Cesta", "Chal", "Chaleco", "Chalupa", "Chamarra", "Chancleta", 
    "Chancla", "Chanclas", "Chaqueta", "Charola", "Chasis", "Chequera", "Chimenea", "Chincheta", "Chistera", "Chupete", 
    "Chupón", "Ciclomotor", "Cilindro", "Cincel", "Cincho", "Cinta", "Cinturón", "Cirio", "Cisterna", "Claxon", 
    "Clavo", "Clip", "Clips", "Closet", "Clóset", "Cobertor", "Cobija", "Cobijas", "Coche", "Cochecito", "Cofre", 
    "Cohete", "Cojín", "Cojines", "Coladera", "Colador", "Colchón", "Colcha", "Colgante", "Collar", "Columpio", "Comal", 
    "Cometa", "Cómoda", "Compactador", "Compás", "Computadora", "Condensador", "Conector", "Congelador", "Conmutador", 
    "Cono", "Consola", "Copa", "Copón", "Coraza", "Corbata", "Corbatín", "Cordel", "Cordón", "Corneta", "Corona", 
    "Correa", "Carrete", "Cortacésped", "Cortaplumas", "Cortapelos", "Cortauñas", "Cortina", "Cortinas", "Costal", 
    "Costurero", "Crayón", "Crayones", "Crema", "Cremallera", "Crisol", "Crucifijo", "Cruz", "Cuaderno", "Cuadro", 
    "Cuenco", "Cuerda", "Cuerno", "Cuero", "Cuna", "Cuña", "Cúpula", "Curita", "Cúter", "Cuchara", "Cucharón", "Cuchilla", 
    "Cuchillo",
    # D
    "Dado", "Daga", "Dardo", "Dedal", "Defensa", "Delantal", "Dentífrico", "Depiladora", "Depósito", "Desarmador", 
    "Descalzador", "Desinfectante", "Desodorante", "Despertador", "Destapador", "Destornillador", "Detector", "Diadema", 
    "Diamante", "Diario", "Diapasón", "Dibujo", "Diccionario", "Dique", "Disco", "Disquete", "Disyuntor", "Diván", 
    "Doblador", "Documento", "Dominó", "Dosificador", "Drenaje", "Dron", "Ducha",
    # E
    "Edredón", "Eje", "Elástico", "Electrodoméstico", "Electroimán", "Elevador", "Embudo", "Emisor", "Empaque", 
    "Encendedor", "Enchufe", "Engrapadora", "Engranaje", "Envase", "Envoltorio", "Escalera", "Escáner", "Escoba", 
    "Escobillón", "Escopeta", "Escotilla", "Escuadra", "Escudo", "Escultura", "Esfera", "Eslabón", "Esmalte", "Espada", 
    "Espadín", "Espátula", "Espejo", "Espiga", "Espinillera", "Esponja", "Espuela", "Esqueleto", "Esquí", "Estaca", 
    "Estambre", "Estampa", "Estante", "Estantería", "Estatua", "Estera", "Estetoscopio", "Estilógrafo", "Estribo", 
    "Estuche", "Estufa", "Etiqueta", "Extintor", "Exprimidor",
    # F
    "Faja", "Falda", "Faldón", "Faro", "Farol", "Farola", "Fax", "Felpudo", "Ferry", "Fibra", "Ficha", "Fichero", 
    "Fieltro", "Filamento", "Filmadora", "Filtro", "Flauta", "Flautín", "Flecha", "Florero", "Flotador", "Foco", 
    "Fogón", "Folleto", "Fonendoscopio", "Fonógrafo", "Formón", "Forro", "Fósforo", "Fotocopia", "Fotografía", 
    "Frasco", "Frazada", "Freno", "Frigorífico", "Fuelle", "Fuente", "Funda", "Furgoneta", "Fusil", "Fusible", "Fusta",
    # G
    "Gabinete", "Gafas", "Galón", "Gamuza", "Gancho", "Ganzúa", "Garaje", "Garlopa", "Garfio", "Garrafa", "Garrafón", 
    "Gasa", "Gato hidráulico", "Gaveta", "Gel", "Generador", "Gimnasio", "Giroscopio", "Globo", "Goleta", "Goma", 
    "Góndola", "Gorra", "Gorro", "Goteador", "Gotero", "Grabadora", "Grada", "Gramófono", "Grapa", "Grapadora", "Grapas", 
    "Grifo", "Grillete", "Grúa", "Guadaña", "Guante", "Guantes", "Guardabarros", "Guillotina", "Guirnalda", "Guitarra", 
    "Guitarrón",
    # H
    "Habano", "Hacha", "Hachuela", "Halógeno", "Hamaca", "Hangar", "Harpa", "Hebilla", "Helicóptero", "Hélice", 
    "Herradura", "Herramienta", "Hidrante", "Hierro", "Hilo", "Hisopo", "Hoja", "Hojalata", "Honda", "Horca", "Horno", 
    "Horquilla", "Hoz", "Huacal", "Huarache", "Hueso", "Huso",
    # I
    "Imán", "Impermeable", "Imperdible", "Impresora", "Incensario", "Indicador", "Inflador", "Inodoro", "Insignia", 
    "Instrumento", "Interruptor", "Inyector",
    # J
    "Jabón", "Jabonera", "Jarra", "Jarro", "Jarrón", "Jaula", "Jeringa", "Jeringuilla", "Joya", "Joyero", "Juego", 
    "Juguete",
    # K
    "Kart", "Kayak", "Kétchup", "Kilt", "Kimono", "Kiosco", "Kits",
    # L
    "Lápiz", "Labial", "Laca", "Lanza", "Lámpara", "Lamparilla", "Lancha", "Lazo", "Lector", "Lente", "Lentes", 
    "Lentejuela", "Leotardo", "Letrero", "Libreta", "Libro", "Lienzo", "Lija", "Lima", "Linterna", "Listón", "Litera", 
    "Llave", "Llavero", "Lona", "Loza",
    # M
    "Macana", "Maceta", "Machete", "Maleta", "Maletín", "Mampara", "Mando", "Manga", "Manguera", "Maniquí", "Manubrio", 
    "Mapa", "Máquina", "Marco", "Marro", "Martillo", "Máscara", "Mascarilla", "Matamoscas", "Matraz", "Mazo", "Mechero", 
    "Medalla", "Megáfono", "Memoria", "Mesa", "Mesita", "Metro", "Metrónomo", "Micrófono", "Microondas", "Microscopio", 
    "Mochila", "Módem", "Molcajete", "Molde", "Molino", "Moneda", "Monedero", "Monitor", "Moño", "Mopa", "Motor", 
    "Mouse", "Mueble", "Muleta", "Muñeca", "Muñeco",
    # N
    "Navaja", "Nave", "Nebulizador", "Neceser", "Neopreno", "Neumático", "Nevera", "Nivel", "Notebook",
    # O
    "Obelisco", "Oboe", "Ocarina", "Olla", "Olla exprés", "Organizador", "Órgano", "Orinal", "Osciloscopio", "Overol",
    # P
    "Pala", "Palanca", "Paleta", "Palillo", "Palo", "Pañal", "Pantalón", "Pantalones", "Pantalla", "Pantufla", 
    "Pantuflas", "Pañuelo", "Papel", "Papelera", "Paraguas", "Parapente", "Parasol", "Pared", "Parrilla", "Pasador", 
    "Pastilla", "Patín", "Patines", "Patineta", "Pedal", "Peineta", "Peine", "Película", "Pelota", "Pendiente", 
    "Pendrive", "Percha", "Perchero", "Periódico", "Perla", "Perno", "Persiana", "Pesa", "Pesas", "Piano", "Pico", 
    "Pila", "Pilas", "Pincel", "Pinzas", "Pipeta", "Piragua", "Piscina", "Pistola", "Pizarra", "Pizarrón", "Placa", 
    "Plancha", "Planta", "Plataforma", "Plato", "Playera", "Pluma", "Plumero", "Plumón", "Polea", "Poltrona", "Pomo", 
    "Poncho", "Portarretratos", "Poste", "Pote", "Proyector", "Puente", "Puerta", "Pulsera", "Pupitre",
    # Q
    "Quebrador", "Quena", "Quepis", "Quimono", "Quinqué", "Quitasol",
    # R
    "Radar", "Radio", "Rallador", "Raqueta", "Rascador", "Rastrillo", "Ratón", "Ratonera", "Red", "Reflector", "Refrigerador", 
    "Regadera", "Regla", "Reja", "Reloj", "Remaches", "Remolque", "Remo", "Repisa", "Resorte", "Respirador", "Revistero", 
    "Revista", "Revólver", "Rifle", "Riel", "Robot", "Rodete", "Rodillo", "Ropero", "Rueda", "Ruedas",
    # S
    "Sábana", "Sábanas", "Sable", "Saco", "Sacapuntas", "Salero", "Salvavidas", "Sandalia", "Sandalias", "Sartén", 
    "Saxofón", "Secador", "Secadora", "Sello", "Semáforo", "Señal", "Serpiente de juguete", "Serrucho", "Servilleta", 
    "Servilletero", "Sierra", "Silbato", "Silla", "Sillón", "Sintetizador", "Sobre", "Sofá", "Sombrero", "Sombrilla", 
    "Sonajero", "Sonda", "Sopladora", "Soporte", "Submarino", "Suéter",
    # T
    "Taburete", "Tabla", "Tablero", "Taladro", "Tambor", "Tanque", "Tapa", "Tapete", "Tapiz", "Tapón", "Tarjeta", 
    "Taza", "Tazón", "Teclado", "Techo", "Tejido", "Teléfono", "Telescopio", "Televisión", "Televisor", "Tenedor", 
    "Tenis", "Termo", "Termómetro", "Tester", "Tiesto", "Tijeras", "Timbre", "Timón", "Tinta", "Tintero", "Tirantes", 
    "Tirachinas", "Tiza", "Toalla", "Toallero", "Tobogán", "Toldo", "Tornillo", "Torno", "Tortera", "Tostadora", 
    "Tragamoneda", "Traje", "Trampa", "Transistor", "Trapeador", "Trapo", "Tren", "Triángulo", "Trípode", "Trompeta", 
    "Trompo", "Tronco", "Tubo", "Tuerca", "Turbina",
    # U
    "Ukelele", "Ungüento", "Uniforme", "Unicel", "Urna", "Utensilio", "Uña postiza",
    # V
    "Vagón", "Vajilla", "Valija", "Válvula", "Vaporera", "Vaporizador", "Vara", "Varilla", "Vaso", "Vasija", "Veleta", 
    "Vela", "Velero", "Velocímetro", "Ventana", "Ventilador", "Vestido", "Vial", "Vídeo", "Videocámara", "Videoconsola", 
    "Viga", "Vinilo", "Violín", "Violonchelo", "Visera", "Vitrina", "Volante",
    # W
    "Wafletera", "Walkie-talkie", "Walkman", "Waterpolo gorro", "Webcam", "Whisquera", "Wok",
    # X
    "Xilófono", "Xilografía",
    # Y
    "Yate", "Yelmo", "Yeso", "Yoyo", "Yunque",
    # Z
    "Zalea", "Zanja", "Zapato", "Zapatos", "Zapatilla", "Zapatillas", "Zarcillo", "Zócalo", "Zueco", "Zuecos", "Zurrón",
]

EXTRA_ES_FRUTAS_COMIDAS = [
    "Aceituna", "Acelga", "Achicoria", "Adobo", "Agave", "Aguacate", "Ajo", "Alambre", "Albahaca", "Albóndiga", 
    "Alcachofa", "Alcaparra", "Alfalfa", "Alfajor", "Almeja", "Almendra", "Alubia", "Ananá", "Anchoa", "Anguila", 
    "Antojito", "Apio", "Arándano", "Arenque", "Arroz", "Arroz con leche", "Asado", "Ate", "Atole", "Atún", 
    "Avellana", "Avena", "Azafrán", "Bacalao", "Baguette", "Banana", "Barbacoa", "Batata", "Berenjena", "Berro", 
    "Birria", "Bísquet", "Bizcocho", "Bocadillo", "Bolillo", "Bombón", "Boniato", "Bonito", "Borrego", "Botana", 
    "Bramante", "Brocheta", "Brócoli", "Buñuelo", "Burrito", "Cabrito", "Cacahuate", "Cacao", "Café", "Cajeta", 
    "Calabaza", "Calabacita", "Calamar", "Caldo", "Camarón", "Camote", "Canela", "Cangrejo", "Capirotada", "Caramelo", 
    "Carne", "Carnitas", "Castillo", "Castaña", "Cazuela", "Cebolla", "Cebollín", "Cecina", "Cereza", "Chalupa", 
    "Champiñón", "Champurrado", "Charal", "Chayote", "Chía", "Chícharo", "Chicharrón", "Chilaquiles", "Chile", 
    "Chile relleno", "Chimichanga", "Chinicuil", "Chipotle", "Chirivía", "Chirimoya", "Choclo", "Chocolate", "Chorizo", 
    "Churro", "Cilantro", "Ciruela", "Clavo de olor", "Clementina", "Cochinita", "Cochinita pibil", "Coco", "Col", 
    "Coliflor", "Comino", "Consomé", "Corunda", "Costilla", "Crepa", "Cuachala", "Curry", "Dátil", "Dorado", "Donut", 
    "Durazno", "Ejote", "Elote", "Empanada", "Ensalada", "Enchilada", "Enfrijolada", "Entomatada", "Epazote", 
    "Escamoles", "Espárrago", "Espinaca", "Esquites", "Fajitas", "Frambuesa", "Fresa", "Frijol", "Frijoles", 
    "Fruta del dragón", "Galleta", "Garbanzo", "Garnacha", "Gelatina", "Gordita", "Granada", "Grosella", "Guacamole", 
    "Guanábana", "Guayaba", "Guisado", "Haba", "Hamburguesa", "Harina", "Helado", "Higo", "Hojaldre", "Hongo", 
    "Huarache", "Huevo", "Huevos", "Ibéricos", "Jalapeño", "Jamón", "Jícama", "Jengibre", "Jitomate", "Jocoque", 
    "Jugo", "Kebab", "Kéfir", "Kiwi", "Langosta", "Lasaña", "Laurel", "Leche", "Lechuga", "Lenteja", "Lentejas", 
    "Lima", "Limón", "Linaza", "Litchi", "Lomo", "Longaniza", "Macarrón", "Machaca", "Maguey", "Maíz", "Malanga", 
    "Mandarina", "Mamey", "Mango", "Manzana", "Mantequilla", "Manzanilla", "Maracuyá", "Marisco", "Melocotón", "Melón", 
    "Membrillo", "Menta", "Menudo", "Merengue", "Merluza", "Miel", "Milanesa", "Mijo", "Mixiote", "Molcajete", 
    "Mole", "Mollete", "Mora", "Moras", "Morcilla", "Moronga", "Mortadela", "Mostaza", "Mousse", "Muégano", "Nabo", 
    "Nachos", "Naranja", "Nata", "Nectarina", "Nieve", "Níspero", "Nogada", "Nopal", "Nuez", "Ñame", "Oblea", 
    "Omelet", "Oreja", "Orégano", "Ostión", "Ostra", "Paella", "Palmito", "Palomitas", "Pan", "Pambazo", "Pan dulce", 
    "Pan de muerto", "Panela", "Panqué", "Papa", "Papas", "Papaya", "Pasa", "Pasas", "Pasta", "Pastel", "Pastores", 
    "Pato", "Pavo", "Pechuga", "Pellizcada", "Pelón", "Pepino", "Pepitas", "Pera", "Perejil", "Pescado", "Picadillo", 
    "Pico de gallo", "Pimiento", "Pimienta", "Piña", "Piñón", "Pipián", "Pistacho", "Pizza", "Plátano", "Pollo", 
    "Polvorón", "Pomelo", "Poroto", "Pozole", "Puchero", "Pudín", "Puerco", "Puré", "Quesadilla", "Queso", "Quiche", 
    "Quinoa", "Rábano", "Rábanos", "Rajas", "Rambután", "Ravioles", "Rebanada", "Requesón", "Res", "Romeritos", 
    "Romero", "Rompope", "Rosca de Reyes", "Sal", "Salbute", "Salchicha", "Salmón", "Salsa", "Sandía", "Sardina", 
    "Semilla", "Seta", "Sincronizada", "Sopa", "Sope", "Suadero", "Sushi", "Taco", "Tacos", "Tamal", "Tamales", 
    "Tamarindo", "Tapioca", "Taquito", "Tarta", "Tartaleta", "Té", "Tepache", "Tequila", "Ternera", "Tinga", 
    "Tlacoyo", "Tocino", "Tomatillo", "Tomate", "Tomillo", "Toronja", "Torta", "Tortilla", "Tortillas", "Tostada", 
    "Totopos", "Trigo", "Tripas", "Trucha", "Trufa", "Tuna", "Uva", "Uvas", "Vainilla", "Verdura", "Verdolaga", 
    "Vinagre", "Vino", "Wafle", "Xoconostle", "Yateí", "Yogur", "Yuca", "Zacahuil", "Zanahoria", "Zapote", "Zarzamora",
]

EXTRA_ES_PAISES_CIUDADES = [
    "Acapulco", "Aguascalientes", "Ámsterdam", "Alemania", "Argelia", "Argentina", "Armenia", "Australia", "Austria", 
    "Atenas", "Asunción", "Atlanta", "Auckland", "Austin", "Bahamas", "Bélgica", "Belice", "Bolivia", "Brasil", 
    "Bulgaria", "Barcelona", "Barranquilla", "Berlín", "Berna", "Bogotá", "Brasilia", "Bruselas", "Bucarest", 
    "Budapest", "Buenos Aires", "Baja California", "Camerún", "Canadá", "Chile", "China", "Chipre", "Colombia", 
    "Congo", "Corea", "Costa Rica", "Croacia", "Cuba", "Cancún", "Campeche", "Caracas", "Cartagena", "Chicago", 
    "Chiapas", "Chihuahua", "Coahuila", "Colima", "Copenhague", "Córdoba", "Cuernavaca", "Culiacán", "Cuzco", 
    "Dinamarca", "Dominica", "Dallas", "Denver", "Detroit", "Dubái", "Dublín", "Durango", "Ecuador", "Egipto", 
    "El Salvador", "España", "Estados Unidos", "Etiopía", "Edimburgo", "Ensenada", "Estocolmo", "Filipinas", 
    "Finlandia", "Francia", "Filadelfia", "Florencia", "Frankfurt", "Fukushima", "Gabón", "Gambia", "Georgia", 
    "Ghana", "Grecia", "Guatemala", "Guinea", "Guyana", "Ginebra", "Guadalajara", "Guanajuato", "Guerrero", 
    "Guayaquil", "Haití", "Honduras", "Hungría", "Habana", "Hamburgo", "Helsinki", "Hermosillo", "Hidalgo", 
    "Houston", "India", "Indonesia", "Irak", "Irán", "Irlanda", "Islandia", "Israel", "Italia", "Irapuato", 
    "Ixtapa", "Islamabad", "Estambul", "Jamaica", "Japón", "Jordania", "Jalapa", "Jalisco", "Jerusalén", 
    "Johannesburgo", "Juárez", "Kenia", "Kuwait", "Kiev", "Kioto", "Kuala Lumpur", "Laos", "Letonia", "Líbano", 
    "Liberia", "Libia", "Lituania", "Luxemburgo", "La Paz", "León", "Lima", "Lisboa", "Liverpool", "Londres", 
    "Los Ángeles", "Los Cabos", "Madagascar", "Malasia", "Marruecos", "México", "Mónaco", "Mongolia", "Madrid", 
    "Managua", "Manaos", "Manchester", "Manila", "Marsella", "Matamoros", "Mazatlán", "Medellín", "Mérida", 
    "Mexicali", "Miami", "Michoacán", "Milán", "Minsk", "Monclova", "Monterrey", "Montevideo", "Montreal", 
    "Morelia", "Morelos", "Moscú", "Múnich", "Namibia", "Nepal", "Nicaragua", "Nigeria", "Noruega", "Nueva Zelanda", 
    "Nayarit", "Nápoles", "Niza", "Nogales", "Nuevo Laredo", "Nuevo León", "Nueva York", "Oaxaca", "Obregón", 
    "Omán", "Orlando", "Osaka", "Oslo", "Ottawa", "Orizaba", "Países Bajos", "Pakistán", "Panamá", "Paraguay", 
    "Perú", "Polonia", "Portugal", "Pachuca", "París", "Pekín", "Playa del Carmen", "Praga", "Puebla", "Puerto Rico", 
    "Puerto Vallarta", "Qatar", "Querétaro", "Quito", "Quintana Roo", "Reino Unido", "República Checa", 
    "República Dominicana", "Rumania", "Rusia", "Rabat", "Reynosa", "Río de Janeiro", "Roma", "Rosario", 
    "San Marino", "Senegal", "Serbia", "Singapur", "Siria", "Sudáfrica", "Suecia", "Suiza", "Salamanca", "Saltillo", 
    "San Diego", "San Francisco", "San José", "San Luis Potosí", "San Pedro", "Santiago", "Santo Domingo", "Sao Paulo", 
    "Seattle", "Seúl", "Sevilla", "Sidney", "Sinaloa", "Sonora", "Tailandia", "Taiwán", "Tanzania", "Túnez", 
    "Turquía", "Tabasco", "Tamaulipas", "Tampico", "Tapachula", "Taxco", "Tehuacán", "Tepic", "Tijuana", "Tlaxcala", 
    "Tokio", "Toluca", "Toronto", "Torreón", "Tuxtla Gutiérrez", "Ucrania", "Uganda", "Uruguay", "Uruapan", 
    "Vanuatu", "Vaticano", "Venezuela", "Vietnam", "Valencia", "Valparaíso", "Venecia", "Veracruz", "Viena", 
    "Villahermosa", "Washington", "Wellington", "Xalapa", "Yemen", "Yokohama", "Yucatán", "Zambia", "Zimbabue", 
    "Zacatecas", "Zapopan", "Zihuatanejo", "Zúrich",
]

EXTRA_ES_ANIMALES = [
    "Abeja", "Abejorro", "Águila", "Ajolote", "Alacrán", "Albatros", "Alce", "Almeja", "Alondra", "Anchoa", 
    "Anguila", "Antílope", "Araña", "Ardilla", "Arenque", "Armadillo", "Asno", "Atún", "Avestruz", "Avispa", 
    "Babosa", "Bacalao", "Ballena", "Barracuda", "Bisonte", "Bobo", "Bogavante", "Búfalo", "Búho", "Buitre", 
    "Burro", "Caballo", "Caballito de mar", "Cabra", "Cacomixtle", "Cachalote", "Caimán", "Calamar", "Camaleón", 
    "Camello", "Canario", "Cangrejo", "Canguro", "Caracol", "Carpa", "Castor", "Cebra", "Centollo", "Cerdo", 
    "Chacal", "Chimpancé", "Chinche", "Chinchilla", "Chivo", "Ciempiés", "Ciervo", "Cigüeña", "Cisne", "Coati", 
    "Coatí", "Cobaya", "Cocodrilo", "Codorniz", "Colibrí", "Comadreja", "Cóndor", "Conejo", "Copo", "Coral", 
    "Correcaminos", "Coyote", "Cucaracha", "Cuervo", "Danta", "Delfín", "Demonio de Tasmania", "Dingo", "Dinosaurio", 
    "Donadelfo", "Dragón de Komodo", "Dromedario", "Elefante", "Erizo", "Escarabajo", "Escorpión", "Espátula", 
    "Esponja", "Estrella de mar", "Faisán", "Flamenco", "Foca", "Focino", "Gacela", "Gallina", "Gallineta", 
    "Gallo", "Gamba", "Ganso", "Garrapata", "Garza", "Gato", "Gavilán", "Gaviota", "Gecko", "Gibón", "Girafa", 
    "Glotón", "Golondrina", "Gorila", "Gorrión", "Grillo", "Guanaco", "Guepardo", "Gusano", "Halcón", "Hámster", 
    "Hiena", "Hipopótamo", "Hormiga", "Hurón", "Ibex", "Iguana", "Impala", "Jabalí", "Jaguar", "Jilguero", 
    "Jirafa", "Koala", "Lagartija", "Lagarto", "Langosta", "Langostino", "Lechuza", "Lémur", "León", "León marino", 
    "Leopardo", "Libélula", "Liebre", "Lince", "Llama", "Lobo", "Lobo marino", "Lombriz", "Loro", "Luciérnaga", 
    "Macaco", "Mamut", "Manatí", "Mandril", "Mantis", "Mantis religiosa", "Mapache", "Mariposa", "Mariquita", 
    "Marmota", "Medusa", "Mejillón", "Milpiés", "Mirlo", "Mofeta", "Mono", "Morsa", "Mosca", "Mosquito", 
    "Mula", "Murciélago", "Musaraña", "Nutria", "Ñandú", "Ñu", "Ocelote", "Olingo", "Oruga", "Oso", 
    "Oso hormiguero", "Oso pardo", "Oso panda", "Oso polar", "Ostras", "Ostra", "Oveja", "Pájaro", "Paloma", 
    "Pantera", "Pardo", "Pato", "Pavoreal", "Pavo", "Pelícano", "Perdiz", "Perezoso", "Perico", "Periquito", 
    "Perro", "Pez", "Pez espada", "Pez globo", "Pez payaso", "Pingüino", "Piojo", "Piraña", "Polilla", "Pony", 
    "Potro", "Puercoespín", "Pulga", "Pulpo", "Puma", "Quebrantahuesos", "Quetzal", "Rana", "Rata", "Ratón", 
    "Raya", "Reno", "Rinoceronte", "Ruiseñor", "Salamandra", "Salmón", "Saltamontes", "Sanguijuela", "Sapo", 
    "Sardina", "Sepia", "Serpiente", "Suricata", "Tapir", "Tarántula", "Tecolote", "Tejón", "Tiburón", "Tigre", 
    "Tlacuache", "Topo", "Toro", "Tortuga", "Tritón", "Trucha", "Tucán", "Urraca", "Vaca", "Vaquita marina", 
    "Venado", "Víbora", "Vicuña", "Walabí", "Wombat", "Xoloitzcuintle", "Yegua", "Zarigüeya", "Zopilote", 
    "Zorrillo", "Zorro",
]

EXTRA_ES_NOMBRES = [
    "Abel", "Abigail", "Abraham", "Ada", "Adán", "Adela", "Adolfo", "Adrián", "Adriana", "Agatha", "Agustín", "Aída", 
    "Aitor", "Alba", "Alberto", "Alejandro", "Alejandra", "Alejo", "Alex", "Alexander", "Alexis", "Alfonso", "Alfredo", 
    "Alicia", "Alma", "Alonso", "Álvaro", "Amado", "Amador", "Amalia", "Amanda", "Amelia", "Amparo", "Ana", "Anabel", 
    "Anastasia", "Andrea", "Andrés", "Ángel", "Ángela", "Angélica", "Aníbal", "Antonia", "Antonio", "Araceli", "Aranza", 
    "Ariadna", "Ariel", "Armando", "Arnaldo", "Arturo", "Asunción", "Augusto", "Aurelio", "Aurora", "Axel", "Azucena", 
    "Bárbara", "Bartolomé", "Basilio", "Beatriz", "Begoña", "Belén", "Benigno", "Benita", "Benito", "Benjamín", 
    "Bernabé", "Bernardo", "Berta", "Bianca", "Bibiana", "Blanca", "Blas", "Boris", "Braulio", "Brenda", "Brigitte", 
    "Bruna", "Bruno", "Calixto", "Camilo", "Camila", "Candela", "Candelaria", "Cándido", "Caridad", "Carina", "Carlos", 
    "Carlota", "Carmelo", "Carmen", "Carolina", "Casimiro", "Catalina", "Cecilia", "Celeste", "Celia", "César", 
    "Clara", "Clarisa", "Claudia", "Claudio", "Clemente", "Cleopatra", "Cloe", "Concepción", "Conrado", "Constanza", 
    "Consuelo", "Coral", "Corina", "Cornelio", "Cosme", "Cristian", "Cristina", "Cristóbal", "Cruz", "Custodio", 
    "Damián", "Dámaso", "Dana", "Daniel", "Daniela", "Danilo", "Darío", "David", "Débora", "Delfina", "Delia", 
    "Demetrio", "Denis", "Diana", "Diego", "Dina", "Dionisio", "Dolores", "Domingo", "Domitila", "Donato", "Dora", 
    "Dorotea", "Dulce", "Edgar", "Edgardo", "Edith", "Edmundo", "Eduardo", "Eduvigis", "Efraín", "Elba", "Elena", 
    "Eleonor", "Elías", "Elisa", "Elisabet", "Eliseo", "Elsa", "Elvira", "Emanuel", "Emilia", "Emiliano", "Emilio", 
    "Emma", "Encarnación", "Enoc", "Enrique", "Enriqueta", "Eric", "Erika", "Ernesto", "Esmeralda", "Esperanza", 
    "Esteban", "Estefanía", "Estela", "Ester", "Esther", "Estrella", "Eufemia", "Eugenia", "Eugenio", "Eulalia", 
    "Eusebio", "Eva", "Evangelina", "Evelyn", "Ezequiel", "Fabián", "Fabiana", "Fabiola", "Facundo", "Fátima", 
    "Fausto", "Federico", "Feliciano", "Felipe", "Félix", "Fermín", "Fernando", "Fernanda", "Fidel", "Fiona", 
    "Flavia", "Flavio", "Flor", "Florencia", "Fortunato", "Francisca", "Francisco", "Franco", "Frida", "Gabriel", 
    "Gabriela", "Gael", "Gaspar", "Gema", "Genaro", "Genoveva", "Geovanni", "Gerardo", "Germán", "Gertrudis", 
    "Gisela", "Giselle", "Gloria", "Gonzalo", "Gracia", "Graciela", "Gregorio", "Griselda", "Guadalupe", "Guillermina", 
    "Guillermo", "Gustavo", "Guzmán", "Haroldo", "Héctor", "Helena", "Heliodoro", "Heriberto", "Herminia", "Hernán", 
    "Hilario", "Hilda", "Hipólito", "Homero", "Honorato", "Horacio", "Hortensia", "Hugo", "Humberto", "Ian", 
    "Ibrahim", "Idalia", "Ignacio", "Iker", "Ilda", "Ilse", "Imelda", "Inés", "Ingrid", "Inocencio", "Iñaki", 
    "Irene", "Iria", "Iris", "Irma", "Isaac", "Isabel", "Isabela", "Isaías", "Isidoro", "Isidro", "Ismael", 
    "Israel", "Itzel", "Iván", "Ivana", "Ivette", "Jacinto", "Jacobo", "Jacqueline", "Jaime", "Jairo", "Javier", 
    "Jazmín", "Jean", "Jennifer", "Jeremías", "Jerónimo", "Jesús", "Jimena", "Joaquín", "Joel", "Johanna", 
    "Jonás", "Jonathan", "Jordi", "Jorge", "José", "Josefa", "Josefina", "Josué", "Juan", "Juana", "Juanita", 
    "Judith", "Julia", "Julián", "Juliana", "Julieta", "Julio", "Justino", "Karen", "Karim", "Karina", "Karla", 
    "Katia", "Kevin", "Kimberly", "Lara", "Laura", "Lautaro", "Lázaro", "Leandro", "Leila", "Lena", "Leo", 
    "Leonardo", "Leonel", "Leonor", "Leopoldo", "Leticia", "Lía", "Lidia", "Ligia", "Lilia", "Liliana", 
    "Lina", "Lionel", "Lisandro", "Lorena", "Lorenzo", "Lourdes", "Lucas", "Lucía", "Luciana", "Luciano", 
    "Lucio", "Lucrecia", "Luis", "Luisa", "Luz", "Macarena", "Magdalena", "Maite", "Malena", "Manolo", 
    "Manuel", "Manuela", "Mara", "Marcelo", "Marcela", "Marcos", "Margarita", "María", "Mariana", "Mariano", 
    "Marilú", "Marina", "Mario", "Marisa", "Marisol", "Marta", "Martha", "Martín", "Martina", "Mateo", 
    "Matías", "Matilde", "Mauricio", "Mauro", "Maximiliano", "Máximo", "Mayra", "Melany", "Melisa", "Mercedes", 
    "Micaela", "Miguel", "Milagros", "Milena", "Miranda", "Miriam", "Mirta", "Moisés", "Mónica", "Montserrat", 
    "Nadia", "Nahuel", "Nancy", "Narciso", "Natalia", "Natividad", "Nayeli", "Nazareno", "Nélida", "Nelson", 
    "Néstor", "Nicolás", "Nicole", "Nidia", "Nieves", "Noé", "Noelia", "Noemí", "Nora", "Norberto", "Norma", 
    "Octavio", "Ofelia", "Olga", "Olimpia", "Oliver", "Olivia", "Omar", "Orlando", "Oscar", "Osvaldo", "Pablo", 
    "Paco", "Paloma", "Paola", "Paolo", "Patricio", "Patricia", "Paula", "Paulina", "Pedro", "Penélope", "Perla", 
    "Pilar", "Plácido", "Priscila", "Quetzal", "Quirino", "Rafael", "Rafaela", "Ramiro", "Ramón", "Ramona", 
    "Raquel", "Raúl", "Rebeca", "Regina", "Reinaldo", "Remedios", "Renata", "Renato", "René", "Reyna", "Ricardo", 
    "Rigoberto", "Rita", "Roberto", "Rocío", "Rodolfo", "Rodrigo", "Rogelio", "Rolando", "Román", "Romina", 
    "Roque", "Rosa", "Rosalía", "Rosario", "Roxana", "Rubén", "Rufino", "Rut", "Ruth", "Sabina", "Sabrina", 
    "Salomé", "Salvador", "Samanta", "Samuel", "Sandra", "Santiago", "Sara", "Saúl", "Sebastián", "Selena", 
    "Sergio", "Silvana", "Silvia", "Silvio", "Simón", "Socorro", "Sofía", "Soledad", "Sonia", "Susana", "Tamara", 
    "Tania", "Tarsicio", "Tatiana", "Telma", "Teodoro", "Teresa", "Timoteo", "Tito", "Tomás", "Trinidad", "Tristán", 
    "Ulises", "Uriel", "Úrsula", "Valentín", "Valentina", "Valeria", "Valerio", "Vanesa", "Vanessa", "Verónica", 
    "Vicente", "Víctor", "Victoria", "Vidal", "Vilma", "Violeta", "Virginia", "Viviana", "Vladimir", "Walter", 
    "Wanda", "Wendy", "Wilfredo", "William", "Xavier", "Ximena", "Xiomara", "Yadira", "Yahir", "Yanina", 
    "Yazmín", "Yolanda", "Yuri", "Zacarías", "Zaira", "Zoé", "Zulema",
]

EXTRA_ES_COLORES = [
    "Almendra", "Amarillo", "Amarillo limón", "Amarillo mostaza", "Amarillo pastel", "Ámbar", "Amatista", 
    "Añil", "Antracita", "Aqua", "Aquamarina", "Arena", "Azabache", "Azahar", "Azul", "Azul acero", 
    "Azul cielo", "Azul cobalto", "Azul eléctrico", "Azul marino", "Azul noche", "Azul pastel", "Azul petróleo", 
    "Azul pavo", "Azul rey", "Azul turquesa", "Bananero", "Beige", "Bermejo", "Bermellón", "Blanco", 
    "Blanco hueso", "Blanco marfil", "Blanco perla", "Bronce", "Burdeos", "Café", "Café con leche", 
    "Calabaza", "Camello", "Canela", "Caoba", "Caramelo", "Carbón", "Carmesí", "Carmín", "Celeste", 
    "Cenizo", "Ceniza", "Cereza", "Cerezo", "Champán", "Chocolate", "Cian", "Ciruela", "Cobre", "Cobre rojizo", 
    "Cochinilla", "Coral", "Crema", "Dorado", "Durazno", "Ébano", "Esmeralda", "Escarlata", "Frambuesa", 
    "Fresa", "Fucsia", "Garnet", "Granate", "Gris", "Gris acero", "Gris marengo", "Gris perla", "Gris plomo", 
    "Guinda", "Hueso", "Humo", "Índigo", "Ivory", "Jade", "Jazmín", "Kaki", "Lacre", "Ladrillo", "Lavanda", 
    "Lila", "Lima", "Limón", "Lino", "Magenta", "Maíz", "Malva", "Mandarina", "Marfil", "Marrón", "Melón", 
    "Menta", "Miel", "Mora", "Morado", "Mostaza", "Nácar", "Naranja", "Negro", "Negro azabache", "Niquel", 
    "Nuez", "Ocre", "Oliva", "Oro", "Oxido", "Paja", "Palo de rosa", "Pastel", "Pardo", "Peltre", "Perla", 
    "Petróleo", "Piel", "Pino", "Pistacho", "Plata", "Plateado", "Plomo", "Púrpura", "Rojo", "Rojo carmesí", 
    "Rojo cereza", "Rojo escarlata", "Rojo fuego", "Rojo granate", "Rojo pasión", "Rojo teja", "Rojo vino", 
    "Rosa", "Rosa mexicano", "Rosa pastel", "Rosa palo", "Rosado", "Rubí", "Salmón", "Sepia", "Tabaco", 
    "Teja", "Terracota", "Tierra", "Tomate", "Topacio", "Toronja", "Trigo", "Turquesa", "Uva", "Vainilla", 
    "Verde", "Verde agua", "Verde botella", "Verde bosque", "Verde esmeralda", "Verde jade", "Verde lima", 
    "Verde manzana", "Verde militar", "Verde musgo", "Verde oliva", "Verde olivo", "Verde pasto", "Verde pistacho", 
    "Vino", "Violeta", "Zafiro",
]

EXTRA_ES_FLORES_PLANTAS = [
    "Acacia", "Acedera", "Achicoria", "Acónito", "Adelfa", "Agapanto", "Agave", "Agrimonia", "Aguacate árbol", 
    "Ajedrea", "Albahaca", "Albaricoquero", "Alcornoque", "Alegría", "Alfalfa", "Alhelí", "Almez", "Almendra árbol", 
    "Aloe", "Aloe vera", "Amapola", "Amor de hombre", "Anémona", "Anturio", "Arándano planta", "Árbol de jade", 
    "Arce", "Arenaria", "Árnica", "Arrayán", "Artemisa", "Aspidistra", "Aster", "Azalea", "Azucena", "Bambú", 
    "Bananero", "Baobab", "Bardanera", "Begonia", "Belladona", "Betónica", "Bignonia", "Bonsái", "Borraja", 
    "Bougainvillea", "Bromelia", "Buganvilla", "Buxus", "Cactus", "Caladio", "Calafate", "Cala", "Caléndula", 
    "Camelia", "Campanilla", "Camomila", "Caña", "Caoba árbol", "Capuchina", "Cardo", "Carex", "Castor planta", 
    "Cebollino", "Cedro", "Ceiba", "Celinda", "Cempasúchil", "Centáurea", "Cerezo", "Ciprés", "Cisne flor", 
    "Clavel", "Clavelina", "Clemátide", "Clivia", "Cobaea", "Colocasia", "Consuelda", "Corazón de María", 
    "Cosmos", "Crisantemo", "Croto", "Crotón", "Culantro", "Dalia", "Diente de león", "Digitalis", "Drácena", 
    "Durillo", "Echeveria", "Encina", "Enebro", "Epazote", "Espadana", "Espantapájaros planta", "Espatifilo", 
    "Espliego", "Espuela de caballero", "Estefanotis", "Eucalipto", "Euforbia", "Ficus", "Flor de cera", 
    "Flor de loto", "Flor de Nochebuena", "Flor de Pascua", "Frambueso", "Fresia", "Fresno", "Gardenia", 
    "Geranio", "Gerbera", "Ginkgo", "Girasol", "Gladiola", "Glicinia", "Gloxinia", "Gomero", "Granado", 
    "Guzmania", "Haya", "Helecho", "Heliotropo", "Hibisco", "Hiedra", "Hierbabuena", "Hierba luisa", "Higuera", 
    "Hinojo", "Hortensia", "Jacaranda", "Jacinto", "Jazmín", "Junco", "Kalanchoe", "Kiwano planta", "Lantana", 
    "Laurel", "Lavanda", "Lechuga de mar", "Lila", "Liliácea", "Lirio", "Loto", "Madreselva", "Magnolia", 
    "Malva", "Mandarino", "Mangle", "Manzano", "Manzanilla", "Margarita", "Maranta", "Melisa", "Menta", 
    "Mimosa", "Monstera", "Musgo", "Naranjo", "Nardo", "Narciso", "Nectarino", "Nenúfar", "Nogal", "Nopal", 
    "Olivo", "Olmo", "Orquídea", "Ortiga", "Pacaya", "Palma", "Palmera", "Palma de cera", "Palmito", 
    "Papiro", "Pasionaria", "Pensamiento", "Peonía", "Peral", "Persea", "Petunia", "Pino", "Pita", 
    "Plátano árbol", "Potos", "Poto", "Primavera", "Prímula", "Quebracho", "Quercus", "Retama", "Ricino", 
    "Roble", "Romero", "Rosa", "Rosa del desierto", "Ruda", "Sabina", "Salvia", "Sansevieria", "Sauce", 
    "Sauz", "Saúco", "Siempreviva", "Tamarindo árbol", "Taray", "Tejo", "Tilo", "Tomillo", "Toronjil", 
    "Trebol", "Trébol", "Tulipán", "Valeriana", "Vara de oro", "Verbena", "Verdolaga", "Vinca", "Violeta", 
    "Violeta africana", "Yuca", "Zantedeschia", "Zarzamora planta", "Zempoalxóchitl", "Zinnia",
]

EXTRA_EN_OBJECTS_THINGS = [
    "Air conditioner", "Alarm clock", "Album", "Ambulance", "Anchor", "Antenna", "Anvil", "Apartment", "Appliance", 
    "Apron", "Armchair", "Armor", "Arrow", "Ashtray", "Automobile", "Axe", "Baby bottle", "Backpack", "Badge", 
    "Bag", "Ball", "Balloon", "Bandage", "Banknote", "Banner", "Barometer", "Barrel", "Basin", "Basket", "Basketball", 
    "Bat", "Battery", "Bathtub", "Beaker", "Bed", "Bedding", "Bedspread", "Bell", "Belt", "Bench", "Bicycle", 
    "Bill", "Bin", "Binoculars", "Birdcage", "Blade", "Blanket", "Blankets", "Blender", "Blouse", "Board", 
    "Boat", "Bolt", "Book", "Bookcase", "Boombox", "Boot", "Boots", "Bottle", "Bow", "Bowl", "Box", "Bracelet", 
    "Brake", "Brick", "Bridge", "Briefcase", "Broom", "Brush", "Bucket", "Buckle", "Bulb", "Bullet", "Bumper", 
    "Bunk bed", "Bunting", "Bus", "Button", "Cabinet", "Cable", "Cables", "Cage", "Calculator", "Calendar", 
    "Camera", "Campfire", "Can", "Can opener", "Candle", "Candlestick", "Cane", "Cannon", "Canoe", "Cap", 
    "Cape", "Car", "Caravan", "Card", "Cardboard", "Carpet", "Cart", "Case", "Cash", "Casket", "Castle", 
    "Catapult", "CD", "Ceiling fan", "Cell phone", "Chain", "Chair", "Chalk", "Chandelier", "Charger", "Checkbook", 
    "Chest", "Chisel", "Cigar", "Cigarette", "Clamp", "Clip", "Clips", "Cloak", "Clock", "Closet", "Cloth", 
    "Clothes", "Clothespin", "Coat", "Coffee maker", "Coffeepot", "Coin", "Colander", "Comb", "Comforter", 
    "Compass", "Computer", "Cone", "Container", "Controller", "Cord", "Cork", "Corkscrew", "Costume", "Cot", 
    "Couch", "Countertop", "Cradle", "Crate", "Crayon", "Crayons", "Crowbar", "Crown", "Crutch", "Cup", 
    "Cupboard", "Curtain", "Curtains", "Cushion", "Cushions", "Cutlery", "Dagger", "Dart", "Desk", "Device", 
    "Dial", "Diamond", "Diary", "Dice", "Dictionary", "Dish", "Dishwasher", "Dispenser", "Doll", "Door", 
    "Doorknob", "Doormat", "Drawer", "Dress", "Dresser", "Drill", "Drone", "Drum", "Dryer", "Dumbbell", 
    "Dustbin", "Dustpan", "Duvet", "Earphones", "Earring", "Earrings", "Easel", "Engine", "Envelope", "Eraser", 
    "Eyeglasses", "Fabric", "Fan", "Faucet", "Feather", "Fence", "File", "Film", "Filter", "Fire extinguisher", 
    "Fireplace", "Flag", "Flashlight", "Flask", "Flute", "Folder", "Fork", "Fountain", "Frame", "Freezer", 
    "Fridge", "Frying pan", "Furnace", "Furniture", "Fuse", "Gamepad", "Garbage can", "Gasket", "Gate", 
    "Gauge", "Gear", "Generator", "Glass", "Glasses", "Glove", "Gloves", "Glue", "Goggles", "Gong", "Grater", 
    "Grill", "Guitar", "Gun", "Hairbrush", "Hairdryer", "Hammer", "Hammock", "Handbag", "Handcuffs", "Handkerchief", 
    "Handle", "Hanger", "Hardware", "Harmonica", "Harp", "Hat", "Headband", "Headphones", "Heater", "Helmet", 
    "Hinge", "Hoe", "Hook", "Horn", "Hose", "Hourglass", "House", "Hubcap", "Hydrant", "Ice skates", "Ignition", 
    "Incubator", "Ink", "Instrument", "Intercom", "Iron", "Ironing board", "Jacket", "Jar", "Jeans", "Jersey", 
    "Jewel", "Jewelry", "Journal", "Jug", "Kettle", "Key", "Keyboard", "Keyring", "Kite", "Knife", "Knob", 
    "Ladder", "Ladle", "Lamp", "Lampshade", "Lantern", "Laptop", "Laser", "Latch", "Lawnmower", "Lens", 
    "Letter", "Level", "Lever", "Life jacket", "Lighter", "Lipstick", "Lock", "Locket", "Loudspeaker", 
    "Luggage", "Machete", "Machine", "Magazine", "Magnet", "Mailbox", "Mannequin", "Map", "Marble", "Mask", 
    "Match", "Matchbox", "Mattress", "Medal", "Megaphone", "Microphone", "Microscope", "Microwave", "Mirror", 
    "Missile", "Mixer", "Mobile phone", "Model", "Modem", "Money", "Monitor", "Mop", "Motor", "Motorcycle", 
    "Mouse", "Mousepad", "Mouthpiece", "Mug", "Nail", "Nail clipper", "Napkin", "Necklace", "Needle", 
    "Net", "Newspaper", "Notebook", "Nozzle", "Nut", "Oar", "Oboe", "Oil lamp", "Organ", "Ornament", "Ottoman", 
    "Oven", "Pad", "Padlock", "Pail", "Paint", "Paintbrush", "Palette", "Pan", "Pants", "Paper", "Paperclip", 
    "Parachute", "Parcel", "Passport", "Pavilion", "Pedal", "Peg", "Pen", "Pencil", "Pencil sharpener", 
    "Pendant", "Penny", "Phone", "Photograph", "Piano", "Picture", "Pillow", "Pillows", "Pin", "Pipe", 
    "Pitcher", "Plane", "Plank", "Plant pot", "Plate", "Platform", "Pliers", "Plug", "Pocketknife", "Poker", 
    "Pole", "Porcelain", "Poster", "Pot", "Pouch", "Printer", "Prism", "Projector", "Propeller", "Pump", 
    "Puppet", "Purse", "Puzzle", "Quilt", "Rack", "Radar", "Radiator", "Radio", "Raft", "Rail", "Rake", 
    "Razor", "Record", "Recorder", "Reel", "Refrigerator", "Remote", "Ribbon", "Rifle", "Ring", "Robe", 
    "Robot", "Rocket", "Rod", "Roller", "Rollerblades", "Rope", "Rowboat", "Ruler", "Sack", "Saddle", 
    "Safe", "Sail", "Sailboat", "Sandals", "Sandpaper", "Saucepan", "Saucer", "Saw", "Saxophone", "Scaffold", 
    "Scale", "Scalpel", "Scarf", "Scissors", "Scooter", "Scoreboard", "Scraper", "Screen", "Screw", "Screwdriver", 
    "Scythe", "Seat", "Sensor", "Sewing machine", "Shovel", "Shower", "Sieve", "Sign", "Signal", "Silk", 
    "Sink", "Skateboard", "Skates", "Ski", "Skis", "Skirt", "Sled", "Sledge", "Slippers", "Slot machine", 
    "Smartphone", "Smoke detector", "Snowboard", "Soap", "Sock", "Socks", "Sofa", "Solar panel", "Spade", 
    "Spanner", "Speaker", "Spear", "Spectacles", "Spoon", "Sprayer", "Spring", "Sprinkler", "Stamp", "Staple", 
    "Stapler", "Statue", "Steamer", "Steering wheel", "Stereo", "Stethoscope", "Stick", "Stool", "Stove", 
    "Strap", "Straw", "Streetlight", "String", "Suit", "Suitcase", "Sunglasses", "Sunscreen", "Swallow", 
    "Sweater", "Switch", "Sword", "Syringe", "Table", "Tablecloth", "Tablet", "Tambourine", "Tank", "Tape", 
    "Tape measure", "Teacup", "Teapot", "Telescope", "Television", "Tent", "Thermometer", "Thermos", "Thimble", 
    "Thread", "Ticket", "Tie", "Timer", "Tin", "Tire", "Toaster", "Toothbrush", "Toothpaste", "Torch", 
    "Towel", "Toy", "Trailer", "Train", "Trampoline", "Tray", "Tripod", "Trophy", "Trowel", "Truck", "Trumpet", 
    "Trunk", "Tub", "Tube", "Tuning fork", "Turbine", "Turnstile", "Tweezers", "Typewriter", "Umbrella", 
    "Uniform", "Urn", "Utensil", "Vacuum", "Vacuum cleaner", "Valve", "Van", "Vase", "Vault", "Vehicle", 
    "Vent", "Vest", "Vial", "Video game", "Violin", "Visor", "Volleyball", "Waffle iron", "Wagon", "Walkman", 
    "Wall", "Wallet", "Wardrobe", "Watch", "Water bottle", "Watering can", "Weapon", "Webcam", "Wedge", 
    "Wheel", "Wheelbarrow", "Wheelchair", "Whip", "Whistle", "Wig", "Winch", "Windmill", "Window", "Windshield", 
    "Wire", "Workbench", "Wrench", "Wristwatch", "Xylophone", "Yacht", "Yarn", "Zipper",
]

def load_existing():
    dict_rs_path = BASE_DIR / 'src' / 'dictionary.rs'
    text = dict_rs_path.read_text(encoding='utf-8')
    data = {}
    pattern = r'pub static ([A-Z_]+): &\[&str\] = &\[(.*?)\];'
    for name, content in re.findall(pattern, text, re.DOTALL):
        words = re.findall(r'\"([^\"]+)\"', content)
        data[name] = words
    return data

def main():
    existing = load_existing()
    print("Loaded existing categories from src/dictionary.rs:")
    for k, v in existing.items():
        print(f"  {k}: {len(v)} words")

    # Combine categories
    def merge(existing_list, extra_list):
        seen = set()
        merged = []
        for w in list(existing_list) + list(extra_list):
            clean = w.strip()
            if not clean or len(clean) < 2:
                continue
            key = clean.lower()
            if key not in seen:
                seen.add(key)
                merged.append(clean)
        # Sort alphabetically (case-insensitive)
        merged.sort(key=lambda s: s.lower())
        return merged

    all_data = {
        # ES
        "NOMBRES": merge(existing.get("NOMBRES", []), EXTRA_ES_NOMBRES),
        "APELLIDOS": merge(existing.get("APELLIDOS", []), []),
        "PAISES_CIUDADES": merge(existing.get("PAISES_CIUDADES", []), EXTRA_ES_PAISES_CIUDADES),
        "ANIMALES": merge(existing.get("ANIMALES", []), EXTRA_ES_ANIMALES),
        "FRUTAS_COMIDAS": merge(existing.get("FRUTAS_COMIDAS", []), EXTRA_ES_FRUTAS_COMIDAS),
        "OBJETOS_COSAS": merge(existing.get("OBJETOS_COSAS", []), EXTRA_ES_OBJETOS_COSAS),
        "COLORES": merge(existing.get("COLORES", []), EXTRA_ES_COLORES),
        "FLORES_PLANTAS": merge(existing.get("FLORES_PLANTAS", []), EXTRA_ES_FLORES_PLANTAS),
        # EN
        "EN_NAMES": merge(existing.get("EN_NAMES", []), []),
        "EN_SURNAMES": merge(existing.get("EN_SURNAMES", []), []),
        "EN_COUNTRIES_CITIES": merge(existing.get("EN_COUNTRIES_CITIES", []), []),
        "EN_ANIMALS": merge(existing.get("EN_ANIMALS", []), []),
        "EN_FRUITS_FOODS": merge(existing.get("EN_FRUITS_FOODS", []), []),
        "EN_OBJECTS_THINGS": merge(existing.get("EN_OBJECTS_THINGS", []), EXTRA_EN_OBJECTS_THINGS),
        "EN_COLORS": merge(existing.get("EN_COLORS", []), []),
        "EN_FLOWERS_PLANTS": merge(existing.get("EN_FLOWERS_PLANTS", []), []),
    }

    print("\nAfter expansion:")
    for k, v in all_data.items():
        print(f"  {k}: {len(v)} words")

    # Double check "cobija" is in OBJETOS_COSAS
    assert "Cobija" in all_data["OBJETOS_COSAS"], "Error: Cobija not found in OBJETOS_COSAS!"

    # 1. Update src/dictionary.rs
    dict_rs_path = BASE_DIR / 'src' / 'dictionary.rs'
    orig_rs = dict_rs_path.read_text(encoding='utf-8')
    header_end = orig_rs.find("pub static NOMBRES: &[&str] = &[")
    if header_end == -1:
        raise ValueError("Could not find start of static arrays in dictionary.rs")
    header = orig_rs[:header_end]

    rs_code = [header.rstrip(), ""]
    for k, words in all_data.items():
        rs_code.append(f"pub static {k}: &[&str] = &[")
        for w in words:
            # Escape double quotes or backslashes if any
            escaped = w.replace('\\', '\\\\').replace('"', '\\"')
            rs_code.append(f'    "{escaped}",')
        rs_code.append("];")
        rs_code.append("")

    dict_rs_path.write_text("\n".join(rs_code).strip() + "\n", encoding='utf-8')
    print(f"\nWrote updated {dict_rs_path}")

    # 2. Update public/dictionary.js
    # Map Rust names to JS category IDs
    js_data = {
        "es": {
            "nombre": all_data["NOMBRES"],
            "apellido": all_data["APELLIDOS"],
            "pais_ciudad": all_data["PAISES_CIUDADES"],
            "animal": all_data["ANIMALES"],
            "fruta_comida": all_data["FRUTAS_COMIDAS"],
            "cosa_objeto": all_data["OBJETOS_COSAS"],
            "color": all_data["COLORES"],
            "flor_planta": all_data["FLORES_PLANTAS"],
        },
        "en": {
            "nombre": all_data["EN_NAMES"],
            "apellido": all_data["EN_SURNAMES"],
            "pais_ciudad": all_data["EN_COUNTRIES_CITIES"],
            "animal": all_data["EN_ANIMALS"],
            "fruta_comida": all_data["EN_FRUITS_FOODS"],
            "cosa_objeto": all_data["EN_OBJECTS_THINGS"],
            "color": all_data["EN_COLORS"],
            "flor_planta": all_data["EN_FLOWERS_PLANTS"],
        }
    }

    dict_js_path = BASE_DIR / 'public' / 'dictionary.js'
    dict_js_path.write_text(f"const BASTA_DICTIONARY = {json.dumps(js_data, ensure_ascii=False)};\n", encoding='utf-8')
    print(f"Wrote updated {dict_js_path}")

if __name__ == '__main__':
    main()
