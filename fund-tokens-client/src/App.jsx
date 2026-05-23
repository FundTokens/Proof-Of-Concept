import "./App.scss";
import {
    RouterProvider,
    createRoutesFromElements,
    Route,
    createHashRouter,
} from "react-router-dom";
import { ErrorBoundary } from 'react-error-boundary'
import { Home, Error } from "./pages";
import { RootLayout } from "./components/layout";

const router = createHashRouter(
    createRoutesFromElements(
        <Route element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route path='/:fundCategoryId' element={<Home />} />
            <Route path="/Error" element={<Error />} />
        </Route>
    )
);

function App() {
    return (
        <ErrorBoundary fallback={<div>Something went really wrong...</div>}>
            <RouterProvider router={router} />
        </ErrorBoundary>
    );
}

export default App;
