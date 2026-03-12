import React, { useState, useEffect } from 'react';
import { CalendarClock, CheckCircle, XCircle, Search, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../../auth/useAuth';

export default function AprobadorVacaciones() {
    const { token, hasPermission } = useAuth();
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAcceso, setLoadingAcceso] = useState(true);
    const [puedeAprobar, setPuedeAprobar] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [comentarioModal, setComentarioModal] = useState('');
    const [accionSeleccionada, setAccionSeleccionada] = useState(null);
    const [solicitudEnProceso, setSolicitudEnProceso] = useState(null);

    const fetchSolicitudes = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/vacaciones?scope=aprobaciones', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSolicitudes(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching solicitudes RH', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCapacidadAprobacion = async () => {
        try {
            setLoadingAcceso(true);
            const response = await axios.get('/api/vacaciones/puede-aprobar', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setPuedeAprobar(!!response.data.data?.puede_aprobar);
            }
        } catch {
            setPuedeAprobar(false);
        } finally {
            setLoadingAcceso(false);
        }
    };

    useEffect(() => {
        fetchSolicitudes();
        fetchCapacidadAprobacion();
    }, []);

    const esAdminAprobador = hasPermission('RH_ADMIN');

    const abrirModal = (solicitud, accion) => {
        setSolicitudEnProceso(solicitud);
        setAccionSeleccionada(accion);
        setComentarioModal('');
    };

    const cerrarModal = () => {
        setSolicitudEnProceso(null);
        setAccionSeleccionada(null);
        setComentarioModal('');
    };

    const confirmarAccion = async () => {
        if (!solicitudEnProceso || !accionSeleccionada) return;

        try {
            setProcessingId(solicitudEnProceso.id);
            const response = await axios.put(`/api/vacaciones/${solicitudEnProceso.id}/responder`, {
                estado: accionSeleccionada,
                comentarios_aprobador: comentarioModal
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                cerrarModal();
                fetchSolicitudes();
            }
        } catch (error) {
            console.error('Error al actualizar estado', error);
            alert(error.response?.data?.message || 'Error al procesar la solicitud');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusIcon = (estado) => {
        switch (estado) {
            case 'Aprobada': return <CheckCircle className="text-emerald-500" size={18} />;
            case 'Rechazada': return <XCircle className="text-rose-500" size={18} />;
            default: return <Clock className="text-amber-500" size={18} />;
        }
    };

    const getStatusStyle = (estado) => {
        switch (estado) {
            case 'Aprobada': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Rechazada': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    const sortedSolicitudes = [...solicitudes].sort((a, b) => {
        if (a.estado === 'Pendiente' && b.estado !== 'Pendiente') return -1;
        if (a.estado !== 'Pendiente' && b.estado === 'Pendiente') return 1;
        return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Aprobación de Vacaciones</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Gestiona las solicitudes de vacaciones de los empleados.</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                    <CalendarClock size={20} />
                    <span className="font-semibold">{solicitudes.filter(s => s.estado === 'Pendiente').length} Pendientes</span>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar empleado..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {(loading || loadingAcceso) ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                                    <th className="p-4 font-medium">Empleado</th>
                                    <th className="p-4 font-medium">Fechas</th>
                                    <th className="p-4 font-medium text-center">Días</th>
                                    <th className="p-4 font-medium">Comentarios (Empleado)</th>
                                    <th className="p-4 font-medium">Estado</th>
                                    <th className="p-4 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedSolicitudes.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-gray-500">
                                            {!puedeAprobar && !esAdminAprobador
                                                ? 'No tienes colaboradores asignados para aprobar vacaciones.'
                                                : 'No hay solicitudes registradas'}
                                        </td>
                                    </tr>
                                ) : (
                                    sortedSolicitudes.map((sol) => (
                                        <tr key={sol.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{sol.nombres} {sol.apellido_paterno}</div>
                                                <div className="text-xs text-gray-500">#{sol.numero_empleado}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {new Date(sol.fecha_inicio).toLocaleDateString()} al {new Date(sol.fecha_fin).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">{sol.dias_solicitados}</span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={sol.comentarios}>
                                                {sol.comentarios || '-'}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(sol.estado)}`}>
                                                    {getStatusIcon(sol.estado)}
                                                    {sol.estado}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {sol.estado === 'Pendiente' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => abrirModal(sol, 'Aprobada')}
                                                            disabled={processingId === sol.id}
                                                            className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                                        >
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() => abrirModal(sol, 'Rechazada')}
                                                            disabled={processingId === sol.id}
                                                            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                                        >
                                                            Rechazar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Procesada</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {solicitudEnProceso && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            {accionSeleccionada === 'Aprobada' ? (
                                <CheckCircle className="text-emerald-500" size={24} />
                            ) : (
                                <XCircle className="text-rose-500" size={24} />
                            )}
                            <h3 className="text-xl font-bold dark:text-white">
                                {accionSeleccionada === 'Aprobada' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
                            </h3>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                            ¿Estás seguro de {accionSeleccionada === 'Aprobada' ? 'aprobar' : 'rechazar'} las vacaciones de <strong>{solicitudEnProceso.nombres}</strong>
                            &nbsp;({solicitudEnProceso.dias_solicitados} días)?
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comentarios para el empleado (Opcional)</label>
                            <textarea
                                value={comentarioModal}
                                onChange={(e) => setComentarioModal(e.target.value)}
                                rows="3"
                                placeholder={accionSeleccionada === 'Rechazada' ? 'Ej. En estas fechas tenemos cierre...' : 'Ej. ¡Disfruta tus vacaciones!'}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={cerrarModal}
                                disabled={processingId !== null}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarAccion}
                                disabled={processingId !== null}
                                className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${
                                    accionSeleccionada === 'Aprobada' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                                }`}
                            >
                                {processingId !== null ? 'Procesando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}