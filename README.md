# Currency

Currency is a Preact application scaffold for a currency conversion assessment.
The current page displays only `Hello`. Currency conversion remains planned.

## Requirements

- Node.js 24 (`>=24 <25`).

Choose one environment manager below to prepare Node.js, pnpm, and Just.
The pinned versions are recorded in [.tool-versions](.tool-versions) and the locked Nix environment.
The scaffold needs no API account or credentials.

## Start

Run commands from the project directory after preparing your selected manager:

| Environment                     | Start the application    |
| ------------------------------- | ------------------------ |
| Nix Flake                       | `nix develop -c just up` |
| mise                            | `mise run up`            |
| asdf                            | `asdf exec just up`      |
| Tools already available on PATH | `just up`                |

Each command installs dependencies from `pnpm-lock.yaml`, then starts the application development server.
The TypeScript watch task checks application code, tests, and tool configuration during development.
Open [the application](http://localhost:5173).
The terminal reports the actual port if the default is occupied.
Press Ctrl+C to stop the server and type watchers.

## Prepare an Environment

Only your chosen manager is required.

<details>
<summary>Install an environment manager</summary>

Use the official installation instructions for your operating system:

- [Nix](https://nixos.org/download/) with `nix-command` and `flakes` enabled.
- [mise](https://mise.jdx.dev/getting-started).
- [asdf](https://asdf-vm.com/guide/getting-started.html), including its shims PATH setup.

</details>

### Nix Flake

The Flake supplies the development tools.
Use `nix develop` for an interactive environment, then run the shared Just commands.

Optional [direnv](https://direnv.net/docs/installation.html) activation:

```sh
direnv allow .
just up
```

The project's `.envrc` is a Nix-only convenience. Leave it unauthorized when using mise or asdf without Nix.

### mise

`mise run up` reads `.tool-versions`, installs missing tools, and invokes the shared startup command.
Shell activation is optional. Use `mise exec -- just check` for other Just workflows.

### asdf

Register only plugins you have not already installed:

```sh
asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
asdf plugin add pnpm https://github.com/jonathanmorley/asdf-pnpm.git
asdf plugin add just https://github.com/olofvndrhr/asdf-just.git
```

Install the declared versions and start the project:

```sh
export PATH="${ASDF_DATA_DIR:-$HOME/.asdf}/shims:$PATH"
asdf install
asdf exec just up
```

The shims PATH lets nested commands use the same declared tools.

### Existing Tools

If Node.js, pnpm, and Just are already installed, use the versions declared in `.tool-versions` and run `just up`.
No environment manager is required for this path.

## Commands

Run these commands inside the chosen environment. Prefix them with `nix develop -c`, `mise exec --`, or `asdf exec` when needed.

| Command       | Purpose                                         |
| ------------- | ----------------------------------------------- |
| `just`        | List available workflows.                       |
| `just setup`  | Install dependencies with frozen pnpm locking.  |
| `just up`     | Install dependencies and start the application. |
| `just check`  | Check formatting, lint rules, and TypeScript.   |
| `just build`  | Build the application into `dist/`.             |
| `just test`   | Check types, then run TypeScript unit tests.    |
| `just format` | Apply lint fixes and formatting.                |

Use pnpm for package operations. `package.json` pins its version, and `pnpm-lock.yaml` owns the dependency lock.
`pnpm-workspace.yaml` records the build-script permission needed by esbuild.

`pnpm run dev` starts the server and TypeScript watch task. It forwards server arguments, such as `--port 5174`.
Tests and builds stop on type errors. The initial scaffold contains no test cases yet.

## Stack

| Area                               | Source                           |
| ---------------------------------- | -------------------------------- |
| Application, styling, and checks   | [package.json](package.json)     |
| Nix environment                    | [flake.nix](flake.nix)           |
| Shared mise and asdf tool versions | [.tool-versions](.tool-versions) |
| mise startup task                  | [mise.toml](mise.toml)           |

## License

No license has been declared yet.
