import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { TableContainer } from "../../components/ui/table";
import { RegistrarProveedorModal } from "../../components/modals/registrar_proveedor";
import { supabase } from "../../libs/supabase";
import { Plus, Pencil, Trash } from "lucide-react";
import { EditarProveedorModal } from "../../components/modals/editar_proveedor";

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalRegistrar, setModalRegistrar] = useState(false);
  const [modalEditar, setModalEditar] = useState<{ open: boolean; data?: any }>({ open: false });

  useEffect(() => {
    const fetchProveedores = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("proveedor").select("*");

      if (error) {
        console.error("Error al cargar proveedores:", error);
      } else {
        setProveedores(data || []);
      }
      setLoading(false);
    };

    fetchProveedores();
  }, []);

  const handleRegistrar = async (form: {
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
  }) => {
    const { data, error } = await supabase
      .from("proveedor")
      .insert([
        {
          nombre: form.nombre,
          direccion: form.direccion,
          telefono: form.telefono, // Se elimina la conversion a numero para evitar truncamiento
          email: form.email,
        },
      ])
      .select(); // .select() para que devuelva el registro insertado

    if (error) {
      console.error("Error al registrar proveedor:", error);
      // Podrías querer lanzar el error para que el modal lo muestre
      throw error;
    }

    if (data) {
      // Añadir el nuevo proveedor a la lista sin tener que volver a cargar todo
      setProveedores((prev) => [...prev, ...data]);
    }
  };

  const handleEditar = async (form: {
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
  }) => {
    if (!modalEditar.data?.id_proveedor) return;

    const { data, error } = await supabase
      .from("proveedor")
      .update(form)
      .eq("id_proveedor", modalEditar.data.id_proveedor)
      .select();

    if (error) {
      console.error("Error al editar proveedor:", error);
      throw error;
    }

    if (data) {
      setProveedores((prev) =>
        prev.map((p) => (p.id_proveedor === data[0].id_proveedor ? data[0] : p))
      );
    }
  };

  const handleEliminar = async (id_proveedor: number) => {
    if (window.confirm("¿Está seguro de que desea eliminar este proveedor?")) {
      const { error } = await supabase
        .from("proveedor")
        .delete()
        .eq("id_proveedor", id_proveedor);

      if (error) {
        console.error("Error al eliminar proveedor:", error);
        alert("Error al eliminar el proveedor.");
      } else {
        setProveedores((prev) => prev.filter((p) => p.id_proveedor !== id_proveedor));
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-500 text-lg mt-1">
            Gestión de proveedores de fármacos
          </p>
        </div>
        <Button
          className="flex items-center gap-2 font-medium bg-black hover:bg-gray-900 text-white"
          onClick={() => setModalRegistrar(true)}
        >
          <Plus className="h-5 w-5" />
          Registrar Proveedor
        </Button>
      </div>

      {loading ? (
        <p>Cargando proveedores...</p>
      ) : (
        <TableContainer
          columns={[
            {
              header: "Nombre",
              render: (item) => (
                <span className="font-medium text-gray-900">{item.nombre}</span>
              ),
              sortKey: "nombre",
            },
            { header: "Dirección", render: (item) => item.direccion, sortKey: "direccion" },
            { header: "Teléfono", render: (item) => item.telefono, sortKey: "telefono" },
            { header: "Email", render: (item) => item.email, sortKey: "email" },
            {
              header: "Acciones",
              render: (item) => (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setModalEditar({ open: true, data: item })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleEliminar(item.id_proveedor)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ),
            },
          ]}
          data={proveedores}
        />
      )}

      <RegistrarProveedorModal
        open={modalRegistrar}
        onClose={() => setModalRegistrar(false)}
        onRegistrar={handleRegistrar}
      />

      <EditarProveedorModal
        open={modalEditar.open}
        onClose={() => setModalEditar({ open: false, data: undefined })}
        proveedor={modalEditar.data}
        onEditar={handleEditar}
      />
    </div>
  );
}
