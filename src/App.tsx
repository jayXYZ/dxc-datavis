import './App.css'
import MetaMatrix from '@/components/MetaMatrix'
import { ThemeProvider } from "@/components/theme-provider"

function App() {

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="max-h-[80vh] max-w-[80vw] mx-[10vw] my-[10vh] overflow-auto relative border-2 ">
        <MetaMatrix />
      </div>
    </ThemeProvider>
    
  )
}

export default App
