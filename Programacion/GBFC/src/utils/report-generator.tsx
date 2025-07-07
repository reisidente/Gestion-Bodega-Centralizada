import { supabase } from "../libs/supabase";

// Mapeo de tipos de reporte a nombres de vistas/tablas en Supabase
const reportViewMap: { [key: string]: string } = {
    "Stock Bajo": "vista_stock_bajo",
    "Vencimientos": "vista_productos_proximos_a_vencer",
    "Inventario": "inventario",
    "Movimientos": "movimientos_inventario",
};

// Definición de las columnas para cada tipo de reporte
const reportColumns: { [key: string]: any[] } = {
    "Stock Bajo": [
        { header: "Fármaco", render: (item: any) => item.nombre_farmaco, getValue: (item: any) => item.nombre_farmaco },
        { header: "Stock Actual", render: (item: any) => item.stock_actual, getValue: (item: any) => item.stock_actual },
        { header: "Stock Mínimo", render: (item: any) => item.stock_minimo, getValue: (item: any) => item.stock_minimo },
        { header: "Diferencia", render: (item: any) => item.diferencia_stock, getValue: (item: any) => item.diferencia_stock },
    ],
    "Vencimientos": [
        { header: "Fármaco", render: (item: any) => item.nombre_farmaco, getValue: (item: any) => item.nombre_farmaco },
        { header: "Lote", render: (item: any) => item.lote, getValue: (item: any) => item.lote },
        { header: "Fecha Vencimiento", render: (item: any) => new Date(item.fecha_vencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }), getValue: (item: any) => new Date(item.fecha_vencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) },
        { header: "Días para Vencer", render: (item: any) => item.dias_para_vencer, getValue: (item: any) => item.dias_para_vencer },
    ],
    "Inventario": [
        { header: "Fármaco", render: (item: any) => item.farmaco.nombre_farmaco, getValue: (item: any) => item.farmaco.nombre_farmaco },
        { header: "Proveedor", render: (item: any) => item.proveedor.nombre_proveedor, getValue: (item: any) => item.proveedor.nombre_proveedor },
        { header: "Stock Actual", render: (item: any) => item.stock_actual, getValue: (item: any) => item.stock_actual },
        { header: "Última Actualización", render: (item: any) => new Date(item.fecha_actualizacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date(item.fecha_actualizacion).toLocaleTimeString('es-ES'), getValue: (item: any) => new Date(item.fecha_actualizacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date(item.fecha_actualizacion).toLocaleTimeString('es-ES') },
    ],
    "Movimientos": [
        { header: "Fármaco", render: (item: any) => item.farmaco.nombre_farmaco, getValue: (item: any) => item.farmaco.nombre_farmaco },
        { header: "Tipo Movimiento", render: (item: any) => item.tipo_movimiento.nombre_movimiento, getValue: (item: any) => item.tipo_movimiento.nombre_movimiento },
        { header: "Cantidad", render: (item: any) => item.cantidad, getValue: (item: any) => item.cantidad },
        { header: "Fecha", render: (item: any) => new Date(item.fecha_movimiento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date(item.fecha_movimiento).toLocaleTimeString('es-ES'), getValue: (item: any) => new Date(item.fecha_movimiento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date(item.fecha_movimiento).toLocaleTimeString('es-ES') },
        { header: "Justificación", render: (item: any) => item.justificacion, getValue: (item: any) => item.justificacion },
    ],
};

// Función principal para generar reportes
export const generateReport = async (tipoReporte: string, parametros: any) => {
    const viewName = reportViewMap[tipoReporte];
    if (!viewName) {
        throw new Error(`Tipo de reporte desconocido: ${tipoReporte}`);
    }

    let query = supabase.from(viewName).select("*");

    // Aplicar filtros y ordenamiento según el tipo de reporte y parámetros
    switch (tipoReporte) {
        case "Stock Bajo":
            // No se necesitan filtros adicionales para esta vista
            break;
        case "Vencimientos":
            query = query.gte('dias_para_vencer', 0);
            if (parametros?.dias) {
                query = query.lte('dias_para_vencer', parametros.dias);
            }
            break;
        case "Inventario":
            query = supabase.from(viewName).select('*, farmaco: id_farmaco(nombre_farmaco, formato, via_administracion), proveedor: id_proveedor(nombre_proveedor)');
            break;
        case "Movimientos":
             query = supabase.from(viewName).select('*, farmaco: id_farmaco(nombre_farmaco), tipo_movimiento: id_tipo_movimiento(nombre_movimiento)');
            if (parametros?.tipoMovimiento && parametros.tipoMovimiento !== 'todos') {
                query = query.eq('id_tipo_movimiento', parametros.tipoMovimiento);
            }
            if (parametros?.fechaInicio) {
                query = query.gte('fecha_movimiento', parametros.fechaInicio);
            }
            if (parametros?.fechaFin) {
                query = query.lte('fecha_movimiento', parametros.fechaFin);
            }
            break;
    }

    const { data, error } = await query;

    if (error) {
        console.error(`Error fetching ${tipoReporte} report:`, error);
        throw new Error(`No se pudo cargar el reporte de ${tipoReporte}.`);
    }

    const columns = reportColumns[tipoReporte];
    if (!columns) {
        throw new Error(`Columnas no definidas para el tipo de reporte: ${tipoReporte}`);
    }

    return { columns, data };
};
