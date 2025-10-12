
'use server';

import { config } from 'dotenv';
config();

import './flows/ocr-ktp-flow';
import './flows/enhance-text-flow';
import './flows/image-generate-flow';
import './flows/news-generator-flow';
import './flows/stamp-pdf-flow';
import './flows/whatsapp-autoreply-flow';
import './flows/assistant-flow';
import './flows/tts-flow';
import './flows/bulk-generate-flow';
import './flows/ocr-pdf-flow';

