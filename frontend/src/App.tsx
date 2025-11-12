import "./index.css";
import RouterIndex from "./routes/RouterIndex";
import { AppProviders } from "./providers/AppProvider";
function App() {
    return (
        <AppProviders>
            <RouterIndex />
        </AppProviders>
    );
}

export default App;
