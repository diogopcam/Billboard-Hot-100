import fs from 'fs/promises';

const token = 'BQDICW887gDHv_DwZUMMPoT7LOa8EbqYBI6MLishQ7PARZKLxEzL9sSoIB9mp8IYao4qD-hNqwWdfVFrpNdNRy0mUpJpzetsb0N-PLvd2kcrIwpGgukdbJ6PqCXNFTnvPaoIdAwpjiCZYSumlKxsmihPR9BdZH5VPrg8nNkETfckUOAfj8fRzoOOT3yKsxgVre26Wx05mA0erg';
async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
    body: JSON.stringify(body),
  });
  return await res.json();
}

// Utiliza o mecanismo de busca do Spotify para realizar uma pesquisa
async function searchArtist(artistName) {
    const response = await fetchWebApi(`v1/search?q=${encodeURIComponent(artistName)}&type=artist`, 'GET');
    return response; // Retorna o primeiro resultado da pesquisa
}

// Retorna o artista com base no ID pesquisado
async function pegaArtistaPorId(id) {
    const response = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
        headers: {
        Authorization: `Bearer ${token}`,
    },
    method: 'GET',
    });
    return await response.json();
}

async function getTopTracks() {
  return (await fetchWebApi(
    'v1/me/top/tracks?time_range=long_term&limit=5', 'GET'
  )).items;
}

async function processArtistsCsv(inputFile, outputFile) {
    try {
      // Ler o arquivo CSV inicial
      const artistsCsv = await fs.readFile(inputFile, 'utf8');
      console.log('Conteúdo do arquivo CSV:', artistsCsv); // Verifica o conteúdo lido do arquivo CSV
      const lines = artistsCsv.trim().split('\n');
      const headers = lines[0].split(',').map(header => header.trim());
      const artistsIndex = headers.indexOf('Artist');
  
      // Processar cada linha do CSV
      const updatedLines = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const cells = line.split(',').map(cell => cell.trim());
        const artistName = cells[artistsIndex];
  
        // Buscar a URL da imagem do artista
        let resultadoPesquisa;
        try {
            resultadoPesquisa = await searchArtist(artistName);
            const idArtista = resultadoPesquisa.artists.items[0].id;
            const urlFotoArtista = resultadoPesquisa.artists.items[0].images[0].url;
            console.log(`URL da imagem para ${artistName}: ${urlFotoArtista}`); // Verifica a URL da imagem obtida  
            
            // Inserir a URL da imagem ao lado do nome do artista
            cells.push(urlFotoArtista);

            // Atualizar a linha no arquivo
            updatedLines.push(cells.join(','));
        } catch (error) {
            console.error(`Erro ao processar o artista ${artistName}:`, error.message);
            console.log(JSON.stringify(resultadoPesquisa));
        }
      }
      const updatedCsv = headers.join(',') + '\n' + updatedLines.join('\n');
      await fs.writeFile(outputFile, updatedCsv);
      console.log(`Arquivo CSV atualizado com URLs das imagens: ${outputFile}`);
    } catch (error) {
      console.error('Erro ao processar os artistas:', error.message);
    }
  }
  
  async function main() {
    try {
        const inputFile = process.argv[2];
        const outputFile = process.argv[3];

        processArtistsCsv(inputFile, outputFile);
    } catch (error) {
      console.error(error);
    }
  }
  
  main();