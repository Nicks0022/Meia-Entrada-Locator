
const map = L.map('map', { zoomControl: false }).setView([-23.5505, -46.6333], 12);
L.control.zoom({ position: 'topright' }).addTo(map);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors & CARTO'
}).addTo(map);

let camadaMarcadores = L.layerGroup().addTo(map);
let circuloRaio = null;
let marcadorUsuario = null;
const marcadoresSalvos = {};

function calcularHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function obterLocalizacaoExata() {
    if (!navigator.geolocation) {
        alert("A geolocalização não é suportada pelo seu navegador.");
        return;
    }

    const lista = document.getElementById('lista-locais');
    lista.innerHTML = '<p class="feedback-msg loading">Solicitando autorização do GPS...</p>';

    const opcoesGeolocalizacao = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        (posicao) => {
            const lat = posicao.coords.latitude;
            const lng = posicao.coords.longitude;
            document.getElementById('input-localizacao').value = "Minha Localização Atual";
            atualizarMapaUsuario(lat, lng);
            buscarLocaisDinamicos(lat, lng);
        },
        (erro) => {
            console.error(erro);
            let mensagem = "Não foi possível obter a sua localização.";
            if (erro.code === erro.PERMISSION_DENIED) {
                mensagem = "Permissão de GPS negada.";
            }
            alert(mensagem);
            lista.innerHTML = `<p class="feedback-msg">${mensagem}</p>`;
        },
        opcoesGeolocalizacao
    );
}

async function iniciarBusca() {
    const endereco = document.getElementById('input-localizacao').value;
    if (!endereco || endereco === "Minha Localização Atual") return;

    const btn = document.querySelector('.btn-search');
    const lista = document.getElementById('lista-locais');
    btn.innerHTML = 'Buscando...';
    lista.innerHTML = '<p class="feedback-msg loading">Localizando endereço...</p>';

    try {
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(endereco)}`;
        const geoRes = await fetch(geoUrl);
        const geoDados = await geoRes.json();

        if (geoDados.length === 0) {
            lista.innerHTML = '<p class="feedback-msg">Localização não encontrada.</p>';
            btn.innerHTML = 'Procurar';
            return;
        }

        const userLat = parseFloat(geoDados[0].lat);
        const userLng = parseFloat(geoDados[0].lon);
        atualizarMapaUsuario(userLat, userLng);
        buscarLocaisDinamicos(userLat, userLng);
    } catch (erro) {
        console.error(erro);
        lista.innerHTML = '<p class="feedback-msg">Erro ao conectar ao serviço de mapas.</p>';
        btn.innerHTML = 'Procurar';
    }
}

function atualizarMapaUsuario(lat, lng) {
    camadaMarcadores.clearLayers();
    if (circuloRaio) map.removeLayer(circuloRaio);
    if (marcadorUsuario) map.removeLayer(marcadorUsuario);

    const userIcon = L.divIcon({
        className: 'custom-user-icon',
        html: '<div style="background-color:#0f172a; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(0,0,0,0.3);"></div>',
        iconSize: [16, 16]
    });

    marcadorUsuario = L.marker([lat, lng], { icon: userIcon }).addTo(map).bindPopup("<b>Sua posição</b>").openPopup();
    circuloRaio = L.circle([lat, lng], { color: '#cbd5e1', weight: 1, fillColor: '#2563eb', fillOpacity: 0.04, radius: 10000 }).addTo(map);
    map.fitBounds(circuloRaio.getBounds());
}

async function buscarLocaisDinamicos(lat, lng) {
    const lista = document.getElementById('lista-locais');
    const btn = document.querySelector('.btn-search');
    lista.innerHTML = '<p class="feedback-msg loading">Buscando cinemas, teatros e museus reais ao seu redor...</p>';

    const query = `
                [out:json];
                (
                  node["amenity"="cinema"](around:10000, ${lat}, ${lng});
                  node["amenity"="theatre"](around:10000, ${lat}, ${lng});
                  node["tourism"="museum"](around:10000, ${lat}, ${lng});
                );
                out 25;
            `;
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const res = await fetch(overpassUrl);
        const dados = await res.json();
        renderizarResultados(dados.elements, lat, lng);
    } catch (erro) {
        console.error(erro);
        lista.innerHTML = '<p class="feedback-msg">Erro ao buscar estabelecimentos parceiros.</p>';
    } finally {
        btn.innerHTML = 'Procurar';
    }
}

function renderizarResultados(elementos, userLat, userLng) {
    const containerLista = document.getElementById('lista-locais');
    containerLista.innerHTML = '';
    const locaisValidos = elementos.filter(el => el.tags && el.tags.name);

    if (locaisValidos.length === 0) {
        containerLista.innerHTML = '<p class="feedback-msg">Nenhum local mapeado num raio de 10km.</p>';
        return;
    }

    locaisValidos.forEach(local => { local.distancia = calcularHaversine(userLat, userLng, local.lat, local.lon); });
    locaisValidos.sort((a, b) => a.distancia - b.distancia);

    locaisValidos.forEach(local => {
        const nome = local.tags.name;
        const dist = local.distancia.toFixed(1);
        let categoria = "Espaço Cultural";
        let regra = "Desconto de estudante mediante apresentação de documento válido.";

        if (local.tags.amenity === 'cinema') { categoria = "Cinema"; regra = "Meia-entrada garantida por lei com a apresentação do DNE."; }
        else if (local.tags.amenity === 'theatre') { categoria = "Teatro"; regra = "50% de desconto em espetáculos teatrais com identificação estudantil."; }
        else if (local.tags.tourism === 'museum') { categoria = "Museu"; regra = "Valor de meia-entrada estendida a estudantes. Verifique dias gratuitos."; }

        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${local.lat},${local.lon}&travelmode=driving`;

        const placeIcon = L.divIcon({
            className: 'custom-place-icon',
            html: '<div style="background-color:#2563eb; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>',
            iconSize: [12, 12]
        });

        const m = L.marker([local.lat, local.lon], { icon: placeIcon }).addTo(camadaMarcadores);
        m.bindPopup(`<b>${nome}</b><br><span style="color:#64748b; font-size:12px;">A ${dist} km</span>`);
        marcadoresSalvos[local.id] = m;

        const cardHTML = `
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <div class="card-title">${nome}</div>
                                <div class="card-category">${categoria}</div>
                            </div>
                            <span class="distance-badge">${dist} km</span>
                        </div>
                        <p class="card-rule">${regra}</p>
                        <div class="card-actions">
                            <button class="btn-map" onclick="focarNoMapa(${local.id}, ${local.lat}, ${local.lon})">
                                <i class="ph ph-map-pin"></i> No Mapa
                            </button>
                            <a href="${googleMapsUrl}" target="_blank" class="btn-route">
                                <i class="ph ph-navigation-arrow"></i> Ver Rota
                            </a>
                        </div>
                    </div>
                `;
        containerLista.innerHTML += cardHTML;
    });
}

function focarNoMapa(id, lat, lng) {
    map.flyTo([lat, lng], 16, { duration: 1.2 });
    setTimeout(() => { if (marcadoresSalvos[id]) marcadoresSalvos[id].openPopup(); }, 1200);
}
