# Currency

Currency is a Preact application scaffold for a currency conversion assessment.
The current page displays only `Hello`. Currency conversion remains planned.

## Requirements

- Node.js 24 (`>=24 <25`).
- A [CurrencyBeacon API key](https://currencybeacon.com/api-documentation), set as `VITE_CURRENCYBEACON_API_KEY` in `.env.local`.

Choose one environment manager below to prepare Node.js, pnpm, and Just.
The pinned versions are recorded in [.tool-versions](.tool-versions) and the locked Nix environment.

Register a free account at [CurrencyBeacon](https://currencybeacon.com/register).
Copy the key from **API Token Information** in the logged-in dashboard.
Create an ignored `.env.local` in the project root:

```dotenv
VITE_CURRENCYBEACON_API_KEY=your_key_here
```

Restart the development server after changing this file.
The key is visible to browser users. Storybook and automated tests use mocked responses and do not require it.

## Start

Run commands from the project directory after preparing your selected manager:

| Environment                     | Start the application and Storybook |
| ------------------------------- | ----------------------------------- |
| Nix Flake                       | `nix develop -c just up`            |
| mise                            | `mise run up`                       |
| asdf                            | `asdf exec just up`                 |
| Tools already available on PATH | `just up`                           |

Each command installs dependencies from `pnpm-lock.yaml`, then starts both development servers.
One shared TypeScript task watches the application and Node projects while both servers run.
Open [the application](http://localhost:5173) and [Storybook](http://127.0.0.1:6006).
The terminal reports the actual ports if these defaults are occupied.
Press Ctrl+C to stop both servers and the type watchers.

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

The Flake supplies the development tools and the matching browser runtime.
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

| Command                    | Purpose                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| `just`                     | List available workflows.                                            |
| `just setup`               | Install dependencies with frozen pnpm locking.                       |
| `just up`                  | Install dependencies and start the application and Storybook.        |
| `just storybook`           | Start Storybook independently.                                       |
| `just check`               | Check formatting, lint rules, and TypeScript.                        |
| `just test`                | Check types, then run unit, Chromium story, and accessibility tests. |
| `just build`               | Build the application into `dist/`.                                  |
| `just format`              | Apply lint fixes and formatting.                                     |
| `pnpm run build-storybook` | Build Storybook into `storybook-static/`.                            |

Use pnpm for package operations. `package.json` pins its version, and `pnpm-lock.yaml` owns the dependency lock.
`pnpm-workspace.yaml` records the build-script permission needed by esbuild.

`pnpm run dev` and `just storybook` also start the TypeScript watch task when used independently.
They forward server arguments, such as `pnpm run dev --port 5174` or `just storybook --port 6007`.
The `dev:server` and `storybook:server` scripts are server-only tasks used by combined startup to avoid duplicate watchers.
Tests and both builds stop on type errors. Use `pnpm run test --project unit` for unit tests.
The existing application, stories, and tool configuration already use TypeScript.

## Browser Tests Outside Nix

After `just setup`, install the browser selected by the locked Playwright package:

```sh
pnpm exec playwright install chromium
just test
```

Run these commands inside mise or asdf, or prefix each command with the selected manager's execution command.
On supported Linux systems, browser tests also need [Playwright's system libraries](https://playwright.dev/docs/browsers#install-system-dependencies).
Install those explicitly with `pnpm exec playwright install-deps chromium` when needed; this can require administrator access.
Application and Storybook startup do not require the test browser installation.

## Stack

| Area                                        | Source                           |
| ------------------------------------------- | -------------------------------- |
| Application, styling, Storybook, and checks | [package.json](package.json)     |
| Nix environment                             | [flake.nix](flake.nix)           |
| Shared mise and asdf tool versions          | [.tool-versions](.tool-versions) |
| mise startup task                           | [mise.toml](mise.toml)           |

## License

No license has been declared yet.
