import formidable from 'formidable';
import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse the incoming form-data
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error parsing form data' });
    }

    try {
      const formData = new FormData();
      // Required image
      if (files.image) {
        formData.append('image', fs.createReadStream(files.image.filepath), files.image.originalFilename);
      } else {
        return res.status(400).json({ error: 'No image uploaded' });
      }
      // Optional background
      if (files.background) {
        formData.append('background', fs.createReadStream(files.background.filepath), files.background.originalFilename);
      }
      // Optional color
      if (fields.color) {
        formData.append('color', fields.color);
      }

      // Forward to RMBG API
      const apiRes = await fetch('https://rmbg.sdad.pro/remove-bg', {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      });

      if (!apiRes.ok) {
        return res.status(apiRes.status).json({ error: 'Failed to process image' });
      }

      res.setHeader('Content-Type', 'image/png');
      apiRes.body.pipe(res);
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });
}
