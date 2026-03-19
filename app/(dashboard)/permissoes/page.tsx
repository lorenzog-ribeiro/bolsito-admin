"use client"

import { useState, useEffect } from "react"
import { Shield, Key, Loader2, UserCog, Trash2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { AdminHeader } from "@/components/admin-header"
import { AdminGuard } from "@/components/admin-guard"
import { useAuth } from "@/lib/auth"
import {
  listAdminUsers,
  getUserWithPermissions,
  updateUserPermissions,
  changeUserPassword,
  changeOwnPassword,
  deleteUser,
  type AuthUserAdmin,
  type AuthUserWithPermissions,
} from "@/lib/admin-api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const changePasswordSchema = z.object({
  newPassword: z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
})

const changeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Obrigatório"),
  newPassword: z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
})

type ChangePasswordForm = z.infer<typeof changePasswordSchema>
type ChangeOwnPasswordForm = z.infer<typeof changeOwnPasswordSchema>

function UserDetailDialog({
  user,
  onClose,
  onUpdated,
  token,
}: {
  user: AuthUserWithPermissions
  onClose: () => void
  onUpdated: () => void
  token: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [localUser, setLocalUser] = useState(user)

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  async function handleToggle(field: "isStaff" | "isSuperuser" | "isActive", value: boolean) {
    setError(null)
    try {
      const updated = await updateUserPermissions(
        user.id,
        { [field]: value },
        token
      )
      setLocalUser((u) => ({ ...u, ...updated }))
      onUpdated()
      toast.success("Permissao atualizada")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar"
      setError(msg)
      toast.error(msg)
    }
  }

  async function handleChangePassword(values: ChangePasswordForm) {
    setError(null)
    setLoading(true)
    try {
      await changeUserPassword(user.id, values.newPassword, token)
      setShowPasswordForm(false)
      form.reset()
      onUpdated()
      toast.success("Senha alterada com sucesso")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar senha"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="size-5" />
            {localUser.name || localUser.username}
          </DialogTitle>
          <DialogDescription>
            {localUser.email} • @{localUser.username}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Permissões</h4>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={localUser.isStaff}
                  onCheckedChange={(v) => handleToggle("isStaff", v)}
                />
                <Label className="text-sm">Staff (Admin)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={localUser.isSuperuser}
                  onCheckedChange={(v) => handleToggle("isSuperuser", v)}
                />
                <Label className="text-sm">Superusuário</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={localUser.isActive}
                  onCheckedChange={(v) => handleToggle("isActive", v)}
                />
                <Label className="text-sm">Ativo</Label>
              </div>
            </div>
          </div>

          {localUser.groups.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Grupos</h4>
              <div className="flex flex-wrap gap-1">
                {localUser.groups.map((g) => (
                  <Badge key={g} variant="secondary">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {localUser.permissions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Permissões</h4>
              <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                <ul className="space-y-1 text-sm">
                  {localUser.permissions.map((p) => (
                    <li key={p.codename} className="flex gap-2">
                      <code className="text-muted-foreground">{p.codename}</code>
                      <span className="text-muted-foreground">—</span>
                      <span>{p.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Alterar senha</h4>
            {!showPasswordForm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordForm(true)}
              >
                <Key className="size-4 mr-2" />
                Definir nova senha
              </Button>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleChangePassword)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova senha</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar senha</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                      Salvar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowPasswordForm(false)
                        form.reset()
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function BulkEditDialog({
  open,
  onOpenChange,
  selectedUsers,
  token,
  onUpdated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedUsers: AuthUserAdmin[]
  token: string
  onUpdated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isStaff, setIsStaff] = useState<boolean | null>(null)
  const [isSuperuser, setIsSuperuser] = useState<boolean | null>(null)
  const [isActive, setIsActive] = useState<boolean | null>(null)

  const hasChanges =
    isStaff !== null || isSuperuser !== null || isActive !== null

  async function handleApply() {
    if (!hasChanges || selectedUsers.length === 0) return
    setError(null)
    setLoading(true)
    try {
      const data: { isStaff?: boolean; isSuperuser?: boolean; isActive?: boolean } = {}
      if (isStaff !== null) data.isStaff = isStaff
      if (isSuperuser !== null) data.isSuperuser = isSuperuser
      if (isActive !== null) data.isActive = isActive

      await Promise.all(
        selectedUsers.map((u) => updateUserPermissions(u.id, data, token))
      )
      onUpdated()
      onOpenChange(false)
      setIsStaff(null)
      setIsSuperuser(null)
      setIsActive(null)
      toast.success(`${selectedUsers.length} usuario(s) atualizado(s)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5" />
            Editar permissões em massa
          </DialogTitle>
          <DialogDescription>
            Aplicar as mesmas permissões aos {selectedUsers.length} usuário
            {selectedUsers.length !== 1 ? "s" : ""} selecionado
            {selectedUsers.length !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Marque as permissões que deseja alterar e defina o valor:
            </p>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <Label className="text-sm">Staff (Admin)</Label>
                <div className="flex gap-2">
                  <Button
                    variant={isStaff === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsStaff(isStaff === true ? null : true)}
                  >
                    Sim
                  </Button>
                  <Button
                    variant={isStaff === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsStaff(isStaff === false ? null : false)}
                  >
                    Não
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm">Superusuário</Label>
                <div className="flex gap-2">
                  <Button
                    variant={isSuperuser === true ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setIsSuperuser(isSuperuser === true ? null : true)
                    }
                  >
                    Sim
                  </Button>
                  <Button
                    variant={isSuperuser === false ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setIsSuperuser(isSuperuser === false ? null : false)
                    }
                  >
                    Não
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm">Ativo</Label>
                <div className="flex gap-2">
                  <Button
                    variant={isActive === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsActive(isActive === true ? null : true)}
                  >
                    Sim
                  </Button>
                  <Button
                    variant={isActive === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsActive(isActive === false ? null : false)}
                  >
                    Não
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!hasChanges || loading}
            onClick={handleApply}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Aplicando...
              </>
            ) : (
              "Aplicar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ChangeOwnPasswordDialog({
  open,
  onOpenChange,
  token,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ChangeOwnPasswordForm>({
    resolver: zodResolver(changeOwnPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: ChangeOwnPasswordForm) {
    setError(null)
    setLoading(true)
    try {
      await changeOwnPassword(
        values.currentPassword,
        values.newPassword,
        token
      )
      form.reset()
      onOpenChange(false)
      toast.success("Sua senha foi alterada com sucesso")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar senha"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="size-5" />
            Alterar minha senha
          </DialogTitle>
          <DialogDescription>
            Informe sua senha atual e a nova senha desejada.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha atual</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="••••••••" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="••••••••" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nova senha</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="••••••••" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                Alterar senha
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default function PermissoesPage() {
  const { token, user } = useAuth()
  const [users, setUsers] = useState<AuthUserAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<AuthUserWithPermissions | null>(null)
  const [showOwnPassword, setShowOwnPassword] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AuthUserAdmin | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [usersToDeleteBulk, setUsersToDeleteBulk] = useState<AuthUserAdmin[] | null>(null)
  const [deletingBulk, setDeletingBulk] = useState(false)

  useEffect(() => {
    if (!token) return
    listAdminUsers(token)
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [token])

  async function openUserDetail(u: AuthUserAdmin) {
    if (!token) return
    try {
      const detail = await getUserWithPermissions(u.id, token)
      setSelectedUser(detail)
    } catch {
      setSelectedUser(null)
    }
  }

  async function handleDeleteUser() {
    if (!token || !userToDelete) return
    setDeleteError(null)
    setDeleting(true)
    try {
      await deleteUser(userToDelete.id, token)
      toast.success("Usuario excluido com sucesso")
      setUserToDelete(null)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(userToDelete.id)
        return next
      })
      listAdminUsers(token).then(setUsers)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir usuario"
      setDeleteError(msg)
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  const selectedUsers = users.filter((u) => selectedIds.has(u.id))
  const selectedForDelete = selectedUsers.filter((u) => u.id !== user?.id)
  const canBulkDelete = selectedForDelete.length > 0

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)))
    }
  }

  function handleBulkDelete() {
    setUsersToDeleteBulk(selectedForDelete)
  }

  async function handleBulkDeleteConfirm() {
    if (!token || !usersToDeleteBulk?.length) return
    setDeleteError(null)
    setDeletingBulk(true)
    try {
      await Promise.all(usersToDeleteBulk.map((u) => deleteUser(u.id, token)))
      toast.success(`${usersToDeleteBulk.length} usuario(s) excluido(s)`)
      setUsersToDeleteBulk(null)
      setSelectedIds(new Set())
      listAdminUsers(token).then(setUsers)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir usuarios"
      setDeleteError(msg)
      toast.error(msg)
    } finally {
      setDeletingBulk(false)
    }
  }

  return (
    <AdminGuard>
      <AdminHeader
        breadcrumbs={[
          { label: "Visão Geral", href: "/" },
          { label: "Permissões" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Permissões de usuários
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visualize permissões, altere senhas e gerencie acessos de admin
            </p>
          </div>
          <Button onClick={() => setShowOwnPassword(true)} variant="outline">
            <Key className="size-4 mr-2" />
            Alterar minha senha
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5" />
              Usuários do sistema
            </CardTitle>
            <CardDescription>
              Clique em um usuário para ver permissões e alterar senha. Selecione
              vários para editar ou excluir em massa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedIds.size > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
                <span className="text-sm font-medium">
                  {selectedIds.size} usuário{selectedIds.size !== 1 ? "s" : ""}{" "}
                  selecionado{selectedIds.size !== 1 ? "s" : ""}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkEdit(true)}
                >
                  <Pencil className="size-4 mr-2" />
                  Editar permissões
                </Button>
                {canBulkDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Excluir selecionados
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Limpar seleção
                </Button>
              </div>
            )}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={
                          users.length > 0 && selectedIds.size === users.length
                        }
                        onCheckedChange={toggleSelectAll}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Papéis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[180px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow
                      key={u.id}
                      className="cursor-pointer"
                      onClick={() => openUserDetail(u)}
                    >
                      <TableCell
                        onClick={(e) => e.stopPropagation()}
                        className="w-[40px]"
                      >
                        <Checkbox
                          checked={selectedIds.has(u.id)}
                          onCheckedChange={() => toggleSelect(u.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {u.name || u.username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @{u.username}
                        </div>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.isSuperuser && (
                            <Badge variant="destructive">Super</Badge>
                          )}
                          {u.isStaff && (
                            <Badge variant="secondary">Admin</Badge>
                          )}
                          {!u.isStaff && !u.isSuperuser && (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.isActive ? (
                          <Badge variant="default">Ativo</Badge>
                        ) : (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-default"
                      >
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openUserDetail(u)}
                          >
                            Ver detalhes
                          </Button>
                          {user?.id !== u.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                setUserToDelete(u)
                              }}
                              title="Excluir usuário"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedUser && token && (
        <UserDetailDialog
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdated={() => {
            listAdminUsers(token).then(setUsers)
          }}
          token={token}
        />
      )}

      {token && (
        <ChangeOwnPasswordDialog
          open={showOwnPassword}
          onOpenChange={setShowOwnPassword}
          token={token}
        />
      )}

      {token && selectedUsers.length > 0 && (
        <BulkEditDialog
          open={showBulkEdit}
          onOpenChange={setShowBulkEdit}
          selectedUsers={selectedUsers}
          token={token}
          onUpdated={() => {
            listAdminUsers(token).then(setUsers)
            setSelectedIds(new Set())
          }}
        />
      )}

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setUserToDelete(null)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O usuário{" "}
              <strong>{userToDelete?.name || userToDelete?.username}</strong> será
              removido permanentemente do sistema.
            </AlertDialogDescription>
            {deleteError && (
              <p className="text-destructive text-sm font-medium">
                {deleteError}
              </p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                type="button"
                disabled={deleting}
                onClick={async (e) => {
                  e.preventDefault()
                  await handleDeleteUser()
                }}
              >
                {deleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!usersToDeleteBulk?.length}
        onOpenChange={(open) => {
          if (!open) {
            setUsersToDeleteBulk(null)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuários em massa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.{" "}
              <strong>{usersToDeleteBulk?.length ?? 0} usuários</strong> serão
              removidos permanentemente do sistema.
            </AlertDialogDescription>
            {deleteError && (
              <p className="text-destructive text-sm font-medium">
                {deleteError}
              </p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingBulk}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                type="button"
                disabled={deletingBulk}
                onClick={async (e) => {
                  e.preventDefault()
                  await handleBulkDeleteConfirm()
                }}
              >
                {deletingBulk ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir todos"
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminGuard>
  )
}
