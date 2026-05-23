# Estudante Maps 📍🎓

Uma aplicação web moderna, minimalista e totalmente responsiva desenvolvida como ferramenta de utilidade pública e cidadania digital. O sistema mapeia estabelecimentos parceiros e de lazer em tempo real, auxiliando estudantes a localizarem locais de direito a benefícios de meia-entrada e incentivos estudantis em um raio dinâmico de 10 km através do GPS ou busca textual.

Este projeto faz parte das atividades de Extensão Universitária do curso de **Tecnologia em Análise e Desenvolvimento de Sistemas (ADS)** da **Universidade Paulista (UNIP)**.

## 🚀 Funcionalidades Contempladas
- **Geolocalização Baseada em API:** Integração com a API nativa do HTML5 (`navigator.geolocation`) para capturar as coordenadas exatas do usuário por meio de GPS com alta precisão.
- **Mapeamento em Tempo Real:** Uso da biblioteca **Leaflet.js** conectada aos servidores open-source do **OpenStreetMap** utilizando o tema leve *CartoDB Positron*.
- **Filtro Avançado de Varredura Dinâmica:** Consumo síncrono da **Overpass API** para executar queries que encontram automaticamente cinemas, teatros e museus reais em um raio exato de 10 km das coordenadas fornecidas.
- **Integração de Rotas:** Botão dinâmico direcionando a origem do usuário diretamente para as direções de viagem do aplicativo externo do **Google Maps**.
- **Interface Responsiva & Minimalista:** Conceito visual limpo estruturado via HTML5 e CSS3 nativos com adaptação móvel completa (*Media Queries*).

## 🛠️ Tecnologias Utilizadas
- **Frontend:** HTML5, CSS3 Nativos e JavaScript (ES6+).
- **Mapas:** Leaflet.js & OpenStreetMap / CartoDB.
- **Consumo de APIs Externas:** - Nominatim Geocoding API (Conversão de endereço em coordenadas)
  - Overpass API (Banco de dados geográfico)
  - Google Maps Directions Engine
- **Tipografia e Ícones:** Inter (Google Fonts) & Phosphor Icons.
