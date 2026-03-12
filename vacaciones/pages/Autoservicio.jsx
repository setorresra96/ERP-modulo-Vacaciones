import React, { useState, useEffect } from 'react';
import { AlertCircle, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/useAuth';

export default function Autoservicio() {
    const { token, usuario } = useAuth();
    const navigate = useNavigate();
    const [solicitudes, setSolicitudes] = useState([]);
    const [solicitudesColaboradores, setSolicitudesColaboradores] = useState([]);
    const [loadingColaboradores, setLoadingColaboradores] = useState(true);
    const [saldo, setSaldo] = useState(null);
    const [loadingSaldo, setLoadingSaldo] = useState(true);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [form, setForm] = useState({
        fecha_inicio: '',
        fecha_fin: '',
        comentarios: ''
    });

    const fetchSolicitudes = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/vacaciones', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const misSolicitudes = response.data.data.filter(s => s.empleado_id === usuario?.id);
                setSolicitudes(misSolicitudes);
            }
        } catch (error) {
            console.error('Error fetching solicitudes', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSaldo = async () => {
        try {
            setLoadingSaldo(true);
            const response = await axios.get('/api/vacaciones/saldo', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSaldo(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching saldo vacaciones', error);
        } finally {
            setLoadingSaldo(false);
        }
    };

    const fetchSolicitudesColaboradores = async () => {
        try {
            setLoadingColaboradores(true);
            const response = await axios.get('/api/vacaciones?scope=aprobaciones', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSolicitudesColaboradores(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching solicitudes de colaboradores', error);
            setSolicitudesColaboradores([]);
        } finally {
            setLoadingColaboradores(false);
        }
    };

    useEffect(() => {
        if (usuario?.id) {
            fetchSolicitudes();
            fetchSaldo();
            fetchSolicitudesColaboradores();
        }
    }, [usuario?.id]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const calcularDiasHabiles = (inicio, fin) => {
        if (!inicio || !fin) return 0;
        const fi = new Date(inicio);
        const ff = new Date(fin);
        let count = 0;
        let curDate = new Date(fi.getTime());
        while (curDate <= ff) {
            const dayOfWeek = curDate.getUTCDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
            curDate.setDate(curDate.getDate() + 1);
        }
        return count;
    };

    const dias_solicitados = calcularDiasHabiles(form.fecha_inicio, form.fecha_fin);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (dias_solicitados <= 0) {
            setError('Las fechas seleccionadas no incluyen días hábiles validos.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                ...form,
                dias_solicitados
            };
            const response = await axios.post('/api/vacaciones/solicitar', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSuccessMsg('Solicitud enviada correctamente.');
                setForm({ fecha_inicio: '', fecha_fin: '', comentarios: '' });
                fetchSolicitudes();
                fetchSaldo();
                fetchSolicitudesColaboradores();
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Ocurrió un error al enviar la solicitud.');
        } finally {
            setSubmitting(false);
            setTimeout(() => setSuccessMsg(''), 5000);
            setTimeout(() => setError(''), 5000);
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Mi Espacio RH</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Gestiona tus solicitudes de vacaciones y consulta tu historial.</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/intranet')}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    Volver a Intranet
                </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 border border-blue-100 dark:border-blue-800 rounded-xl flex items-start space-x-3">
                <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                    Tu saldo vacacional se valida automáticamente al enviar tu solicitud según las reglas de tu contrato y antigüedad. Solo se descuentan días laborables (lunes a viernes).
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                {loadingSaldo ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Calculando saldo de vacaciones...</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Antiguedad</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{saldo?.antiguedad_anios ?? 0} anos</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Dias asignados</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{saldo?.dias_asignados ?? 0}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Dias consumidos</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{saldo?.dias_consumidos ?? 0}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Dias disponibles</p>
                            <p className="text-lg font-semibold text-emerald-600">{saldo?.dias_disponibles ?? 0}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm lg:col-span-1 h-fit">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-blue-600" />
                        Solicitar Vacaciones
                    </h3>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
                            {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Inicio</label>
                            <input
                                type="date"
                                name="fecha_inicio"
                                required
                                value={form.fecha_inicio}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Fin</label>
                            <input
                                type="date"
                                name="fecha_fin"
                                required
                                min={form.fecha_inicio}
                                value={form.fecha_fin}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Días a descontar:</span>
                            <span className="font-bold text-lg text-blue-600">{dias_solicitados}</span>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comentarios (Opcional)</label>
                            <textarea
                                name="comentarios"
                                value={form.comentarios}
                                onChange={handleChange}
                                rows="2"
                                placeholder="Ej. Vacaciones familiares..."
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || dias_solicitados <= 0 || (!loadingSaldo && saldo && dias_solicitados > saldo.dias_disponibles)}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                            {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                        </button>
                    </form>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mi Historial de Solicitudes</h3>

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                        </div>
                    ) : solicitudes.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            No tienes solicitudes de vacaciones previas.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                                        <th className="pb-3 font-medium">Periodo</th>
                                        <th className="pb-3 font-medium text-center">Días</th>
                                        <th className="pb-3 font-medium">Estado</th>
                                        <th className="pb-3 font-medium">Comentarios RH</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {solicitudes.map((sol) => (
                                        <tr key={sol.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-3">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {new Date(sol.fecha_inicio).toLocaleDateString()} - {new Date(sol.fecha_fin).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]" title={sol.comentarios}>
                                                    {sol.comentarios || 'Sin comentarios'}
                                                </div>
                                            </td>
                                            <td className="py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                                                {sol.dias_solicitados}
                                            </td>
                                            <td className="py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(sol.estado)}`}>
                                                    {getStatusIcon(sol.estado)}
                                                    {sol.estado}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 max-w-[250px] truncate" title={sol.comentarios_aprobador || 'Pendiente de revisión'}>
                                                    {sol.comentarios_aprobador || '-'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Historial de Solicitudes de Colaboradores a Cargo</h3>

                {loadingColaboradores ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                    </div>
                ) : solicitudesColaboradores.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        No tienes solicitudes de colaboradores para mostrar.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                                    <th className="pb-3 font-medium">Colaborador</th>
                                    <th className="pb-3 font-medium">Periodo</th>
                                    <th className="pb-3 font-medium text-center">Días</th>
                                    <th className="pb-3 font-medium">Estado</th>
                                    <th className="pb-3 font-medium">Comentarios</th>
                                </tr>
                            </thead>
                            <tbody>
                                {solicitudesColaboradores.map((sol) => (
                                    <tr key={sol.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="py-3">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{sol.nombres} {sol.apellido_paterno}</div>
                                            <div className="text-xs text-gray-500">#{sol.numero_empleado}</div>
                                        </td>
                                        <td className="py-3">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {new Date(sol.fecha_inicio).toLocaleDateString()} - {new Date(sol.fecha_fin).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="py-3 text-center text-sm text-gray-700 dark:text-gray-300">{sol.dias_solicitados}</td>
                                        <td className="py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(sol.estado)}`}>
                                                {getStatusIcon(sol.estado)}
                                                {sol.estado}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="text-xs text-gray-600 dark:text-gray-400 max-w-[280px] truncate" title={sol.comentarios || 'Sin comentarios'}>
                                                {sol.comentarios || '-'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}