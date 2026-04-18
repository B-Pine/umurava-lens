import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

async function testUpload() {
  const form = new FormData();
  form.append('jobId', '60d5ec49e49a883b1c678abc'); // dummy jobId
  form.append('files', fs.createReadStream('./dummy.pdf'));
  
  try {
    const res = await axios.post('http://localhost:5000/api/candidates/upload/files', form, {
      headers: form.getHeaders()
    });
    console.log('Success:', res.data);
  } catch (err: any) {
    console.error('Error:', err.response?.data || err.message);
  }
}

// Create a dummy PDF with some text.
// Wait, actually I can't just write text to a file and call it pdf, pdf-parse will fail.
// I will create a simple script that just runs gemini extraction directly with a string.
