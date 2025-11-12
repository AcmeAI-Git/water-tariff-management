import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "../components/ui/tooltip";
import { Toaster as Sonner } from "../components/ui/sonner";
import { BrowserRouter } from "react-router";
import type { ReactNode } from "react";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
        },
    },
});

export const AppProviders = ({ children }: { children: ReactNode }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <Sonner position="top-center" />
                <BrowserRouter>{children}</BrowserRouter>
            </TooltipProvider>
        </QueryClientProvider>
    );
};
