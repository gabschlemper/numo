// `useProfile` chama dois auto-imports: `useProfileRepository()` e
// `useAuth()`. Os dois são substituídos por dublês aqui — o segundo
// é o que permite verificar a parte que mais importa deste
// composable: que ele pede a `useAuth` para re-perguntar quem está
// logado depois de mudar o perfil.
import { describe, expect, it, vi } from 'vitest'
import { useProfile } from '~/composables/useProfile'
import type { ProfileRepository } from '~/repositories/ProfileRepository'
import { ApiError } from '~/types/apiError'

function stub(overrides: Partial<ProfileRepository> = {}) {
  const repo: ProfileRepository = {
    updateProfile: vi.fn().mockResolvedValue({ id: 'u1', name: 'Malu', email: 'malu@numo.app' }),
    changePassword: vi.fn().mockResolvedValue(undefined),
    ...overrides
  }
  const refreshUser = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('useProfileRepository', () => repo)
  vi.stubGlobal('useAuth', () => ({ refreshUser }))
  return { repo, refreshUser }
}

describe('useProfile', () => {
  it('repassa o patch para o repositório', async () => {
    const { repo } = stub()
    const { updateProfile } = useProfile()
    await updateProfile({ name: 'Malu Silva' })
    expect(repo.updateProfile).toHaveBeenCalledWith({ name: 'Malu Silva' })
  })

  it('re-pergunta quem está logado depois de salvar o perfil', async () => {
    // Sem isto o nome muda no formulário e o avatar da barra lateral
    // continua com o antigo — o usuário conclui que não salvou.
    const { refreshUser } = stub()
    const { updateProfile } = useProfile()
    await updateProfile({ name: 'Malu Silva' })
    expect(refreshUser).toHaveBeenCalledTimes(1)
  })

  it('NÃO atualiza a sessão quando salvar falha', async () => {
    const { refreshUser } = stub({
      updateProfile: vi.fn().mockRejectedValue(new ApiError('validation_failed', 'x', { fields: { name: 'curto' } }))
    })
    const { updateProfile } = useProfile()
    await expect(updateProfile({ name: 'M' })).rejects.toBeInstanceOf(ApiError)
    expect(refreshUser).not.toHaveBeenCalled()
  })

  it('preserva o ApiError, para a página conseguir ler fields', async () => {
    stub({
      updateProfile: vi.fn().mockRejectedValue(
        new ApiError('validation_failed', 'x', { fields: { name: 'O nome precisa ter pelo menos 2 caracteres.' } })
      )
    })
    const { updateProfile } = useProfile()
    await updateProfile({ name: 'M' }).catch((reason: unknown) => {
      expect((reason as ApiError).fields?.name).toBe('O nome precisa ter pelo menos 2 caracteres.')
    })
    expect.assertions(1)
  })

  it('troca de senha não mexe na sessão — o usuário continua o mesmo', async () => {
    const { repo, refreshUser } = stub()
    const { changePassword } = useProfile()
    await changePassword({ currentPassword: 'a', newPassword: 'b' })
    expect(repo.changePassword).toHaveBeenCalledWith({ currentPassword: 'a', newPassword: 'b' })
    expect(refreshUser).not.toHaveBeenCalled()
  })
})
