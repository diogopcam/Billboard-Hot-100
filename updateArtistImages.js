import fs from 'fs/promises';

const token = 'BQC797ah45hoCfg2UKB42aR6f47PTYHEnRZCofQCIw9aRUCHtDbLmUwdlLYqrsM78To8GG17yLlUVC2H8CqFZ4h_GFFUv1XLkkgOpCLwRELPH7Gz1QIl1V59q2UisQXWYOhBzqzd_SC8eS9VdSggxrLKDa4coWQ8KUx-FOdJhViQDjmr_k5uGyPjIUIAa1U11d56iX94b-z7sQ';

async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json' // Adicionamos o Content-Type para JSON
    },
    method,
    body: JSON.stringify(body),
  });
  return await res.json();
}

async function searchArtist(artistName) {
  const response = await fetchWebApi(`v1/search?q=${encodeURIComponent(artistName)}&type=artist`, 'GET');
  return response.artists.items[0]; // Retorna o primeiro resultado da pesquisa
}

async function getArtistImageUrl(artistName) {
  const artist = await searchArtist(artistName);
  if (artist && artist.images && artist.images.length > 0) {
    return artist.images[0].url; // Retorna a URL da primeira imagem do artista
  } else {
    throw new Error(`Imagem do artista "${artistName}" não encontrada`);
  }
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
      try{
        const imageUrl = await getArtistImageUrl(artistName);
        console.log(`URL da imagem para ${artistName}: ${imageUrl}`); // Verifica a URL da imagem obtida  
        // Problema está aqui
      } catch {
        console.log("Problema na requisição!")
        // console.log(imageUrl);
      }
      
      // Inserir a URL da imagem ao lado do nome do artista
      cells.push(imageUrl);

      // Atualizar a linha no arquivo
      updatedLines.push(cells.join(','));
    }

    // Escrever as linhas atualizadas de volta no arquivo CSV
    const updatedCsv = headers.join(',') + '\n' + updatedLines.join('\n');
    await fs.writeFile(outputFile, updatedCsv);

    console.log(`Arquivo CSV atualizado com URLs das imagens: ${outputFile}`);
  } catch (error) {
    console.error('Erro ao processar os artistas:', error.message);
    console.log(imageUrl);
  }
}

// Exemplo de uso: node updateArtistImages.js artists.csv artists_with_images.csv
const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Uso correto: node updateArtistImages.js <arquivo_de_entrada.csv> <arquivo_de_saida.csv>');
  process.exit(1);
}

// processArtistsCsv(inputFile, outputFile);
const function teste => (){

}
getArtistImage('Frank Ocean');