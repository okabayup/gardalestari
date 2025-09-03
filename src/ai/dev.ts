import { config } from 'dotenv';
config();

import './flows/ocr-ktp-flow';
import './flows/enhance-text-flow';
import './flows/image-generate-flow';
import './flows/news-generator-flow';
