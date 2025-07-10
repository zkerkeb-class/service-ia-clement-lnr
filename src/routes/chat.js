const { PrismaClient } = require('../generated/prisma');
const { OpenAI } = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const prisma = new PrismaClient();

module.exports = async function (fastify, opts) {
  fastify.post('/', async (req, reply) => {
    const { question } = req.body;
    console.log('🤖 Question reçue:', question);

    if (!question) {
      return reply.code(400).send({ error: 'Missing question' });
    }

    try {
      console.log('📡 Récupération des produits...');
      const products = await prisma.product.findMany();
      console.log('✅ Produits récupérés:', products.length);

      const productContext = products.map((p) =>
        `ID: ${p.id}\nNom: ${p.name}\nDescription: ${p.description}\nPrix: ${p.price}€`
      ).join('\n\n');

      const prompt = `
        Tu es un assistant commercial pour un site de vente de miniatures de voitures. Tu dois aider les clients à trouver le model reduit parfait en posant des questions pour comprendre leurs préférences.

        Voici les produits disponibles :
        ${productContext}

        INSTRUCTIONS IMPORTANTES :
        1. Ne liste PAS tous les produits d'un coup
        2. Pose des questions pour comprendre les préférences du client (marque, époque, budget, type de conduite, etc.)
        3. Recommande 1-2 voitures maximum à la fois qui correspondent aux critères
        4. Quand tu recommandes une voiture spécifique, fournis TOUJOURS un lien CLIQUABLE en format Markdown : "[Voir la fiche produit](http://localhost:3000/products/[ID_NUMÉRIQUE])" 
           - Utilise UNIQUEMENT l'ID numérique réel visible dans les données ci-dessus (exemple: si ID: 15, alors "[Voir la fiche produit](http://localhost:3000/products/15)")
           - NE PAS inventer de slugs ou utiliser des noms dans l'URL
           - Exemple correct : "[Voir la fiche produit](http://localhost:3000/products/23)"
           - Format Markdown obligatoire pour liens cliquables : [Texte](URL)
        5. Sois conversationnel, amical et posez des questions de suivi
        6. Si le client montre de l'intérêt pour une voiture, donne le lien et propose des alternatives similaires

        Question du client : "${question}"
        
        Réponds de manière bref, engageante et interactive.
      `;

      console.log('🤖 Appel à OpenAI...');
      console.log('🔑 API Key présente:', !!process.env.OPENAI_API_KEY);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        store: true,
        messages: [
          {"role": "user", "content": `${prompt}`},
        ],
      });
      console.log("✅ Réponse OpenAI reçue");
      const answer = completion.choices[0].message.content;

      console.log('📤 Envoi de la réponse:', answer?.substring(0, 100) + '...');
      reply.send({ answer });

    } catch (err) {
      console.error('❌ Erreur détaillée:', err);
      console.error('Stack:', err.stack);
      reply.code(500).send({ 
        error: 'Internal server error',
        details: err.message 
      });
    }
  });
}
