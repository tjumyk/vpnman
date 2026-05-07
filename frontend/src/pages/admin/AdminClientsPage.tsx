import { Button, Modal, NumberInput, Stack } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { fetchAdminClients, importAdminClient } from '@/api'
import { ClientsTable } from '@/components/ClientsTable'
import { ErrorMessage } from '@/components/ErrorMessage'
import { useI18n } from '@/hooks/useI18n'

export function AdminClientsPage(): React.ReactElement {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [localError, setLocalError] = useState<unknown>(null)
  const [opened, setOpened] = useState(false)
  const { data: clients, error } = useQuery({
    queryKey: ['admin', 'clients'],
    queryFn: fetchAdminClients,
  })

  const form = useForm<{ user_id: number | '' }>({
    initialValues: {
      user_id: '',
    },
    validate: {
      user_id: (value) => (value && value > 0 ? null : t('adminClientsUserIdRequired')),
    },
  })

  const importMutation = useMutation({
    mutationFn: (userId: number) => importAdminClient(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] })
      setOpened(false)
      form.reset()
    },
    onError: setLocalError,
  })

  return (
    <Stack>
      <ErrorMessage error={error ?? localError} />
      {clients ? <ClientsTable clients={clients} /> : null}
      <Button onClick={() => setOpened(true)}>{t('adminClientsImportClient')}</Button>

      <Modal opened={opened} onClose={() => setOpened(false)} title={t('adminClientsImportClient')}>
        <form
          onSubmit={form.onSubmit((values) => {
            importMutation.mutate(Number(values.user_id))
          })}
        >
          <Stack>
            <NumberInput hideControls min={1} label={t('clientsTableUserId')} withAsterisk {...form.getInputProps('user_id')} />
            <Button type="submit" loading={importMutation.isPending}>
              {t('adminClientsImportClient')}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
}
