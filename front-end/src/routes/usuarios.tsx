import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, Plus, Trash2, Shield, User } from "lucide-react";

export const Route = createFileRoute("/usuarios")({
    ssr: false,
    beforeLoad: async () => {
        // Obter sessão atual
        const token = localStorage.getItem('token');
        if (!token) {
            throw redirect({ to: '/login' });
        }
        
        try {
            const { data: user } = await api.get('/auth/me');
            if (user.role !== 'admin') {
                throw redirect({ to: '/' });
            }
        } catch (err) {
            throw redirect({ to: '/' });
        }
    },
    component: UsuariosPage 
});

function UsuariosPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [openAdd, setOpenAdd] = useState(false);

    const { data: usuarios = [], isLoading } = useQuery({
        queryKey: ["usuarios-list"],
        queryFn: async () => {
            const { data } = await api.get("/usuarios");
            return data ?? [];
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/usuarios/${id}`);
        },
        onSuccess: () => {
            toast.success("Usuário excluído com sucesso");
            qc.invalidateQueries({ queryKey: ["usuarios-list"] });
        },
        onError: () => toast.error("Erro ao excluir usuário"),
    });

    const filtered = useMemo(() => {
        const s = search.toLowerCase().trim();
        if (!s) return usuarios;
        return usuarios.filter((u: any) =>
            u.nome?.toLowerCase().includes(s) ||
            u.email?.toLowerCase().includes(s)
        );
    }, [usuarios, search]);

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header idêntico às outras páginas */}
                <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-100 blur-3xl" />
                    <div className="absolute bottom-0 left-20 h-32 w-32 rounded-full bg-indigo-100 blur-3xl" />

                    <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                Administração
                            </span>

                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                                Usuários
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Gerencie o acesso ao sistema, cadastre novos usuários e defina níveis de permissão.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                                <DialogTrigger asChild>
                                    <Button className="h-11 rounded-xl bg-slate-950 px-5 font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-sky-700">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Novo usuário
                                    </Button>
                                </DialogTrigger>

                                <NovoUsuarioDialog
                                    onSaved={() => {
                                        setOpenAdd(false);
                                        qc.invalidateQueries({ queryKey: ["usuarios-list"] });
                                    }}
                                    onClose={() => setOpenAdd(false)}
                                />
                            </Dialog>
                        </div>
                    </div>
                </header>

                {/* Resumo rápido */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card className="border-slate-200 p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Total de Usuários</p>
                        <p className="mt-2 text-3xl font-bold text-slate-950">
                            {usuarios.length}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Registrados no sistema
                        </p>
                    </Card>

                    <Card className="border-slate-200 p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Administradores</p>
                        <p className="mt-2 text-3xl font-bold text-indigo-700">
                            {usuarios.filter((u:any) => u.role === 'admin').length}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Com acesso total
                        </p>
                    </Card>

                    <Card className="border-slate-200 p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Filtro Atual</p>
                        <p className="mt-2 truncate text-lg font-semibold text-slate-950">
                            {search || "Nenhum"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Pesquisando por nome ou email
                        </p>
                    </Card>
                </div>

                {/* Busca */}
                <Card className="border-slate-200 p-4 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Pesquisar por nome ou email..."
                            className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11 text-sm focus-visible:ring-sky-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </Card>

                {/* Tabela */}
                <Card className="overflow-hidden border-slate-200 shadow-sm">
                    <div className="border-b border-slate-100 bg-white px-6 py-5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-950">
                                    Lista de Acessos
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Gerencie quem pode acessar o sistema
                                </p>
                            </div>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                {filtered.length} registro(s)
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="font-semibold text-slate-600">Nome</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Email</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Perfil</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-600">Ações</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {isLoading && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
                                                <p className="mt-3 text-sm text-slate-500">
                                                    Carregando usuários...
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!isLoading && filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-14 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <User className="h-10 w-10 text-slate-300" />
                                                <p className="mt-3 text-sm font-medium text-slate-600">
                                                    Nenhum usuário encontrado
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    Tente alterar sua busca.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {filtered.map((u: any) => (
                                    <TableRow key={u.id} className="transition-colors hover:bg-slate-50">
                                        <TableCell>
                                            <div className="font-semibold text-slate-800">{u.nome}</div>
                                            <div className="text-xs text-slate-400">Criado em {new Date(u.criado_em).toLocaleDateString()}</div>
                                        </TableCell>

                                        <TableCell className="text-slate-600">
                                            {u.email}
                                        </TableCell>

                                        <TableCell>
                                            {u.role === 'admin' ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-800">
                                                    <Shield className="h-3 w-3" /> Admin
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                                    <User className="h-3 w-3" /> Padrão
                                                </span>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                                                onClick={() => {
                                                    if (confirm(`Tem certeza que deseja excluir ${u.nome}?`)) {
                                                        deleteMutation.mutate(u.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}

function NovoUsuarioDialog({ onSaved, onClose }: { onSaved: () => void, onClose: () => void }) {
    const [form, setForm] = useState({ nome: "", email: "", senha: "", role: "user" });

    const m = useMutation({
        mutationFn: async () => {
            await api.post("/usuarios", form);
        },
        onSuccess: () => { toast.success("Usuário cadastrado com sucesso"); onSaved(); },
        onError: (e: any) => toast.error(e.response?.data?.error || "Erro ao cadastrar"),
    });

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Novo Usuário</DialogTitle>
                {/* O DialogContent da shadcn/ui já possui o botão de (X) no topo direito por padrão */}
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4">
                <div>
                    <Label>Nome Completo</Label>
                    <Input 
                        placeholder="Ex: Carlos Silva"
                        value={form.nome} 
                        onChange={(e) => setForm({ ...form, nome: e.target.value })} 
                    />
                </div>
                <div>
                    <Label>E-mail</Label>
                    <Input 
                        type="email"
                        placeholder="exemplo@dogliotti.com"
                        value={form.email} 
                        onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    />
                </div>
                <div>
                    <Label>Senha Temporária</Label>
                    <Input 
                        type="password"
                        placeholder="******"
                        value={form.senha} 
                        onChange={(e) => setForm({ ...form, senha: e.target.value })} 
                    />
                </div>
                <div>
                    <Label>Perfil de Acesso</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="user">Padrão (Sem acesso a essa tela)</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter className="sm:justify-end">
                <Button 
                    variant="outline" 
                    onClick={onClose} 
                    className="mr-2"
                >
                    Cancelar
                </Button>
                <Button 
                    onClick={() => m.mutate()} 
                    disabled={!form.nome || !form.email || !form.senha || m.isPending}
                    className="bg-sky-600 hover:bg-sky-700"
                >
                    {m.isPending ? "Salvando..." : "Salvar Usuário"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}
