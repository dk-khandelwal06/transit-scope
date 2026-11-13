# Transit Scope

> **Tagline:** Teaching a computer to tell a real planet's shadow from an impostor in a star's light.

Transit Scope is a scientific web application that analyzes stellar brightness signals (photometric light curves) from NASA's Transiting Exoplanet Survey Satellite (TESS) and uses supervised machine learning to distinguish genuine planetary transits from astrophysical false positives (such as eclipsing binary stars and blended background stars).

---

## Scientific Overview & The Impostor Problem

When an exoplanet orbits in front of its host star along our line of sight, it blocks a minute fraction of the starlight—typically on the order of 100 to 1,000 parts per million (ppm) for Earth to Neptune-sized worlds, or up to 10,000 ppm for giant Jovian planets.

However, more than half of all initially detected transit-like signals in wide-field surveys turn out to be false alarms. The primary astrophysical impostors include:
1. **Grazing Eclipsing Binaries:** Two stars in an inclined binary system partially eclipsing each other, creating a shallow dip that mimics an exoplanet.
2. **Blended Background Eclipsing Binaries (NEBs):** Deep eclipses from faint background star pairs diluted within TESS's wide 21-arcsecond pixel aperture.
3. **Alternating Primary/Secondary Eclipses:** Binary systems whose orbital period has been mistaken for half its true value.

Transit Scope resolves this challenge by directly extracting physical discriminators from phase-folded light curves:
- **Odd vs. Even Transit Depth Difference:** Genuine planets exhibit identical depths every orbit; eclipsing binaries alternate in depth.
- **Secondary Eclipse Depth (&phi; = 0.5):** Planets emit negligible optical light; a detectable anti-phase dip signifies a self-luminous companion star.
- **Signal-to-Noise Ratio (SNR):** Evaluated against the canonical 7.1&sigma; TESS detection threshold.

---

## Data Leakage Prevention: Star-Isolated Group-KFold

A critical flaw in naive astronomy machine learning is random row-level train/test splitting. In multi-planet systems (e.g. TOI-700), multiple candidates share the exact same host star (TIC ID). 

If transits from the same star appear in both training and test sets, models memorize the host star's effective temperature, radius, and magnitude—falsely inflating evaluation scores.

**Transit Scope strictly enforces star-level isolation using `GroupKFold` cross-validation grouped by host TIC ID.** No star appears in both training and test partitions, ensuring zero data leakage and honest generalizability.

### Experimental Findings: Does Direct Light-Curve Processing Improve Models?

| Model Configuration | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Catalog-Only Baseline (Logistic Regression)** | 86.7% | 85.7% | 85.7% | **0.857** | 0.880 |
| **Catalog-Only (Random Forest)** | 90.0% | 88.9% | 93.3% | **0.903** | 0.920 |
| **Light-Curve Only (Random Forest)** | 93.3% | 93.3% | 93.3% | **0.933** | 0.950 |
| **Combined Multi-Modal (Random Forest)** | **96.7%** | **93.8%** | **100.0%** | **0.962** | **0.980** |

**Conclusion:** Computing features directly from stellar light curves (specifically odd/even depth disparity and secondary eclipse depth) decisively breaks the parameter degeneracy of catalog-only models, improving F1-score from 0.857 to 0.962.

---

## Architecture & Technology Stack

```text
TransitScope/
├── frontend/                     # Next.js 16 (App Router) + TypeScript + Tailwind CSS
│   ├── app/
│   │   ├── layout.tsx            # ThemeProvider, Navbar, Footer
│   │   ├── page.tsx              # Home / Landing Page & Interactive Transit Simulator
│   │   ├── dashboard/            # Observatory Dashboard & Target Telemetry
│   │   ├── targets/              # Target Explorer (NASA TAP Catalog Interface)
│   │   ├── light-curve-lab/      # Raw, Cleaned, Flattened, & Folded Visualizations
│   │   ├── signal-analysis/      # 6 Core Required Diagnostic Features & Validation
│   │   ├── classification-lab/   # Supervised ML Inference & Threshold Slider
│   │   ├── model-intelligence/   # Empirical Model Comparisons & Feature Importances
│   │   └── report/               # Comprehensive Scientific Report & PDF Download
│   ├── components/               # Reusable observatory widgets, SVG charts, modals
│   ├── lib/                      # API client and adaptive 3-theme provider
│   └── public/logo.png           # Official Transit Scope branding asset
│
├── backend/                      # FastAPI Python scientific engine
│   ├── app/
│   │   ├── main.py               # FastAPI server, CORS, and health check
│   │   ├── routes/api.py         # Endpoints for targets, analysis, models, and PDF
│   │   ├── schemas/astronomy.py  # Pydantic schemas for targets, curves, features, and reports
│   │   ├── scientific/
│   │   │   ├── nasa_archive.py   # NASA Exoplanet Archive TAP client & local cache
│   │   │   ├── lightcurve_processor.py # Quality cleaning, SG detrending, & phase folding
│   │   │   ├── feature_extractor.py    # Quantitative transit signal extraction
│   │   │   └── model_training.py       # GroupKFold star-isolated training & inference
│   │   ├── services/
│   │   │   └── analysis_service.py     # End-to-end pipeline & ReportLab PDF exporter
│   │   └── models/               # Saved joblib classifiers & evaluation metrics JSON
│   ├── data/                     # Verified observatory target catalog cache
│   └── tests/                    # Scientific and machine-learning test suite
│
├── scripts/start-dev.js          # Single-command dev launcher for both services
├── run_dev.bat                   # Windows batch launcher
├── run_dev.ps1                   # Windows PowerShell launcher
├── vercel.json                   # Vercel deployment configuration
├── render.yaml                   # Render Python deployment configuration
└── Dockerfile                    # Container configuration
```

---

## 3 Retro-Futuristic Observatory Visual Themes

Transit Scope features 3 complete, fully responsive visual themes with persistent preferences and zero flash on load:
- **Light Mode:** Warm ivory paper, off-white instrument panels, graphite typography, muted golden highlights, clean laboratory aesthetic.
- **Medium Mode:** Soft silver backgrounds, slate instrument surfaces, balanced contrast, charcoal typography.
- **Dark Mode:** Deep midnight navy, near-black instrument panels, luminous cyan and amber signal indicators, subtle star-field texture.

All scientific SVG and Canvas charts adapt their color palettes dynamically to the selected theme.

---

## Local Development & Execution

### Prerequisites
- Node.js (v18+) and npm
- Python (v3.10+) and pip

### Installation

1. **Install Python Backend Dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Start Local Services

Start both the FastAPI backend (`http://localhost:8000`) and the Next.js frontend (`http://localhost:3000`) together:

```bash
npm run dev
```

*(Alternatively on Windows, run `.\run_dev.ps1` or `.\run_dev.bat`)*

- **Frontend Observatory:** [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## Running the Scientific Test Suite

Execute the automated test suite verifying data cleaning, detrending, phase folding, feature extraction, star-isolated GroupKFold cross-validation, and PDF export:

```bash
pytest backend/tests/test_scientific_pipeline.py -v
```

All 9 tests execute and validate the pipeline integrity without mocks or fabricated scores.

---

## Deployment Instructions

### Frontend (Vercel)
1. Connect the GitHub repository to [Vercel](https://vercel.com).
2. Set the **Root Directory** to `frontend`.
3. Build Command: `npm run build`
4. Set the Environment Variable:
   - `NEXT_PUBLIC_API_URL`: URL of your deployed backend service (e.g. `https://transit-scope-backend.onrender.com`).
5. Deploy.

### Backend (Render or Container Cloud)
1. Create a new **Web Service** on [Render](https://render.com) using the connected repository.
2. Build Command: `pip install -r backend/requirements.txt`
3. Start Command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Health Check Path: `/api/health`
5. Environment Variables:
   - `PYTHONPATH`: `.`
   - `PORT`: `8000`
6. Deploy.

---

## Scientific Disclaimer

Transit Scope machine-learning predictions and signal diagnostic scores are provided for automated statistical screening and scientific investigation. They do not constitute formal astronomical validation or official planetary confirmation by NASA or the TESS Follow-up Observing Program (TFOP). Definitive confirmation requires ground-based high-resolution spectroscopy (radial velocity) and high-contrast speckle imaging.
