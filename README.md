# Clinic Management System

A full-stack clinic management application built with a modern TypeScript monorepo architecture. The project separates the frontend and backend into independent applications and uses Docker for containerization.

## Features

- **Monorepo Architecture** — Manage frontend and backend applications in a single repository.
- **TypeScript** — Type-safe development.
- **pnpm Workspaces** — Efficient dependency management across applications.
- **Turborepo** — Build and task orchestration for the monorepo.
- **Docker** — Containerize applications for consistent environments.
- **Docker Compose** — Build and run the frontend and backend together.
- **REST API** — Backend API for application functionality.

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js 22 | Backend runtime |
| TypeScript | Type-safe JavaScript development |
| pnpm | Package and workspace management |
| Turborepo | Monorepo task orchestration |
| Docker | Application containerization |
| Docker Compose | Multi-container management |
| Next.js / React | Frontend *(if configured in `apps/web`)* |
| MongoDB / Mongoose | Database and ODM *(if configured in `apps/api`)* |

## Project Structure

```text
clinic-management/
├── apps/
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── src/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── web/
│       ├── Dockerfile
│       ├── src/
│       └── package.json
│
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── turbo.json
├── docker-compose.yml
├── .dockerignore
└── README.md
```

> The exact folders and files may vary depending on the implementation.

## Prerequisites

Install the following tools before running the project:

- [Node.js](https://nodejs.org/) — Version 22
- [pnpm](https://pnpm.io/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

## Getting Started

### 1. Clone the Repository

```bash
git clone <https://github.com/sinnamuthu/clinic-management.git>
cd clinic-management
```

Replace `<https://github.com/sinnamuthu/clinic-management.git>` with your actual GitHub repository URL.

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create the required environment files for the API and frontend based on the variables used in the project.

Example API environment variables:

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Example frontend environment variable, if required:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Use the actual variable names expected by your application. Never commit real passwords, database credentials, or JWT secrets to GitHub.

### 4. Run the Applications Locally

Use the scripts defined in the root `package.json`:

```bash
pnpm dev
```

This command runs the configured development tasks through Turborepo.

## Run with Docker Compose

Make sure Docker Desktop is running.

### Build and Start Services

```bash
docker compose up -d --build
```

### Check Running Containers

```bash
docker compose ps
```

### View Logs

```bash
docker compose logs -f
```

View API logs:

```bash
docker compose logs -f api
```

View frontend logs:

```bash
docker compose logs -f web
```

### Stop Services

```bash
docker compose down
```

## Access the Applications

| Service | Local URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |

These URLs assume the services are configured to listen on the ports defined in `docker-compose.yml`. Use the appropriate API endpoint for testing requests.

## Docker Images

Build the API image separately:

```bash
docker build -f apps/api/Dockerfile -t clinic-api .
```

Build the frontend image separately:

```bash
docker build -f apps/web/Dockerfile -t clinic-web .
```

Run the API container independently only when its required environment variables and dependencies are configured:

```bash
docker run --name clinic-api-container -p 4000:4000 clinic-api
```

For running both applications together, Docker Compose is recommended.

## Useful Commands

| Command | Description |
|---|---|
| `pnpm install` | Install workspace dependencies |
| `pnpm dev` | Start configured development tasks |
| `pnpm build` | Build configured workspace packages |
| `pnpm --filter ./apps/api build` | Build the API application |
| `docker compose up -d --build` | Build and start Compose services |
| `docker compose ps` | Check service status |
| `docker compose logs -f` | Follow service logs |
| `docker compose down` | Stop and remove Compose containers and network |
| `docker images` | List local Docker images |
| `docker ps -a` | List all containers |

## Development Workflow

1. Create a feature branch.
2. Implement the required changes.
3. Run the relevant build and tests.
4. Build and test the Docker images.
5. Commit and push the changes to GitHub.
6. Open a pull request for review.

Example:

```bash
git checkout -b feature/your-feature
git add .
git commit -m "feat: implement your feature"
git push -u origin feature/your-feature
```

## Security Notes

- Do not commit `.env` files containing secrets.
- Add `node_modules`, build output directories, and other generated files to `.gitignore`.
- Keep Docker images and dependencies updated.
- Validate API input and handle errors appropriately.
- Use secure environment variables for production credentials.

## Future Improvements

- Automated testing and code quality checks.
- GitHub Actions CI/CD pipeline.
- Production deployment on AWS.
- Application health checks and monitoring.
- Centralized logging and improved error handling.

## License

No license has been specified yet. Add a `LICENSE` file and update this section if you intend to distribute the project under an open-source license.
