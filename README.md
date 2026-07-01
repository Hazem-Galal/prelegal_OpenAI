# Prelegal

> **Status: Work in Progress** — This project is currently under active development and is expected to be completed by **2026-07-07**.

A platform for drafting common legal agreements quickly and accurately.

## Overview

Prelegal helps individuals and businesses generate standard legal documents without needing a lawyer for routine agreements. It provides templates and guided workflows for the most commonly needed contracts, reducing cost and turnaround time.

## Features

- Draft common legal agreements (NDAs, service agreements, employment contracts, etc.)
- Guided step-by-step document creation
- Downloadable, ready-to-sign outputs
- Clean, plain-language prompts to minimize legal jargon

## Getting Started

### Prerequisites

- Docker

### Running the app

```bash
git clone https://github.com/Hazem-Galal/prelegal.git
cd prelegal
cp .env.example .env   # fill in OPENAI_API_KEY
```

Then, depending on your platform:

```bash
scripts/start-mac.sh       # macOS
scripts/start-linux.sh     # Linux
scripts/start-windows.ps1  # Windows
```

This builds and starts the frontend and backend with Docker Compose. Open `http://localhost:3000`. The backend API is available at `http://localhost:8000`.

Stop the platform with the matching `scripts/stop-*` script for your platform.

## Usage

1. Select the type of legal agreement you need.
2. Fill in the prompted fields (party names, dates, terms, etc.).
3. Review the generated document.
4. Download or export the final agreement.

## Contributing

Contributions are welcome. Please open an issue first to discuss what you would like to change, then submit a pull request against the `main` branch.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

## License

[MIT](LICENSE) © 2026 Hazem Ali
