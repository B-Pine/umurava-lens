import dotenv from 'dotenv';
import { extractCandidateFromCV } from './src/services/geminiService';

dotenv.config();

async function testGemini() {
  const dummyCV = `
  John Doe
  johndoe@email.com | 123-456-7890 | San Francisco, CA
  
  Experience:
  Senior Software Engineer at Google (2018 - Present)
  - Built scalable ML pipelines.
  
  Education:
  BS Computer Science, Stanford (2014)
  
  Skills: Python, TensorFlow, Kubernetes
  `;

  try {
    console.log('Sending text to Gemini...');
    const result = await extractCandidateFromCV(dummyCV);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testGemini();
