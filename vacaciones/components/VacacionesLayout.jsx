import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, FileText, ArrowLeft, Calendar } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../../auth/useAuth';

export default function VacacionesLayout() {
    const location = useLocation();
    const { usuario, token, hasPermission } = useAuth();
    const [puedeAprobar, setPuedeAprobar] = useState(false);
    const puedeAdministrarEmpleados = hasPermission('RH_ADMIN');

    useEffect(() => {
        let mounted = true;

        const verificarAccesoAprobacion = async () => {
            try {
                const response = await axios.get('/api/vacaciones/puede-aprobar', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (mounted && response.data.success) {
                    setPuedeAprobar(!!response.data.data?.puede_aprobar);
                }
            } catch {
                if (mounted) setPuedeAprobar(false);
            }
        };

        if (token) {
            verificarAccesoAprobacion();
        }

        return () => {
            mounted = false;
        };
    }, [token]);

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 shadow-sm relative">
                <div className="p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold tracking-tight text-blue-900 dark:text-blue-400">RH Enterprise</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {usuario?.nombres} {usuario?.apellido_paterno}
                    </p>
                </div>

                <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 150px)' }}>
                    {puedeAdministrarEmpleados && (
                        <Link
                            to="/intranet/rh"
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors font-medium ${location.pathname === '/intranet/rh'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            <LayoutDashboard size={20} strokeWidth={1.5} />
                            <span>Dashboard</span>
                        </Link>
                    )}

                    <Link
                        to="/intranet/vacaciones/miespacio"
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors font-medium ${location.pathname.startsWith('/intranet/vacaciones')
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                            }`}
                    >
                        <FileText size={20} strokeWidth={1.5} />
                        <span>Mi Espacio</span>
                    </Link>

                    {puedeAdministrarEmpleados && (
                        <>
                            <div className="pt-6 pb-2">
                                <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                    Administración
                                </p>
                            </div>

                            <Link
                                to="/intranet/rh/empleados"
                                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors font-medium ${location.pathname === '/intranet/rh/empleados'
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <Users size={20} strokeWidth={1.5} />
                                <span>Directorio Empleados</span>
                            </Link>
                        </>
                    )}

                    {puedeAprobar && (
                        <Link
                            to="/intranet/vacaciones/aprobaciones"
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors font-medium ${location.pathname === '/intranet/vacaciones/aprobaciones'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            <Calendar size={20} strokeWidth={1.5} />
                            <span>Aprobación de Vacaciones</span>
                        </Link>
                    )}

                    {puedeAdministrarEmpleados && (
                        <Link
                            to="/intranet/rh/paquetes-compensacion"
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors font-medium ${location.pathname === '/intranet/rh/paquetes-compensacion'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            <Settings size={20} strokeWidth={1.5} />
                            <span>Paquetes de Compensación</span>
                        </Link>
                    )}
                </nav>

                <div className="absolute bottom-0 w-64 p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                    <Link
                        to="/intranet"
                        className="flex items-center space-x-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
                    >
                        <ArrowLeft size={20} strokeWidth={1.5} />
                        <span className="font-medium">Salir a Intranet</span>
                    </Link>
                </div>
            </aside>

            <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}