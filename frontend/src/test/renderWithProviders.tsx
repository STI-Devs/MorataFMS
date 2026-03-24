import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';

type TestRoute = {
    path: string;
    element: ReactElement;
};

type RenderWithProvidersOptions = {
    route?: string;
    path?: string;
    routes?: TestRoute[];
    queryClient?: QueryClient;
    outletContext?: unknown;
};

export function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
            mutations: {
                retry: false,
            },
        },
    });
}

export function renderWithProviders(
    ui: ReactElement,
    {
        route = '/',
        path = '/',
        routes = [],
        queryClient = createTestQueryClient(),
        outletContext,
    }: RenderWithProvidersOptions = {},
) {
    const routeElements = (
        <>
            <Route path={path} element={ui} />
            {routes.map((testRoute) => (
                <Route key={testRoute.path} path={testRoute.path} element={testRoute.element} />
            ))}
        </>
    );

    const outletContextRoute = (
        <Route element={<Outlet context={outletContext} />}>
            {routeElements}
        </Route>
    );

    return {
        queryClient,
        ...render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={[route]}>
                    <Routes>
                        {outletContext !== undefined ? outletContextRoute : routeElements}
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>,
        ),
    };
}
