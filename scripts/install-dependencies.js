const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("Installing missing dependencies...")

// List of dependencies to install
const dependencies = [
  "@radix-ui/react-avatar",
  "@radix-ui/react-dialog",
  "@radix-ui/react-dropdown-menu",
  "@radix-ui/react-label",
  "@radix-ui/react-popover",
  "@radix-ui/react-scroll-area",
  "@radix-ui/react-select",
  "@radix-ui/react-slot",
  "@radix-ui/react-toast",
  "class-variance-authority",
  "clsx",
  "lucide-react",
  "tailwind-merge",
  "tailwindcss-animate",
]

// Check if yarn.lock exists to determine which package manager to use
const useYarn = fs.existsSync(path.join(process.cwd(), "yarn.lock"))

try {
  const command = useYarn ? `yarn add ${dependencies.join(" ")}` : `npm install ${dependencies.join(" ")}`

  console.log(`Running: ${command}`)
  execSync(command, { stdio: "inherit" })

  console.log("All dependencies installed successfully!")
  console.log('Now run "npm run dev" or "yarn dev" to start your application.')
} catch (error) {
  console.error("Error installing dependencies:", error.message)
  process.exit(1)
}
