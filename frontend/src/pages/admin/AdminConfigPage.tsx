import { Alert, Button, Group, Modal, Stack, Table, Text, TextInput, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import {
  addRoute,
  deleteRoute,
  fetchRoutes,
  managementHardRestart,
  managementShutdown,
  managementSoftRestart,
  updateRoute,
  type RouteForm,
} from '@/api'
import type { RouteRule } from '@/api/schemas'
import { ErrorMessage } from '@/components/ErrorMessage'
import { useI18n } from '@/hooks/useI18n'

const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/

export function AdminConfigPage(): React.ReactElement {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [localError, setLocalError] = useState<unknown>(null)
  const [requireRestart, setRequireRestart] = useState(false)
  const [editingRoute, setEditingRoute] = useState<RouteRule | null>(null)
  const [modalOpened, setModalOpened] = useState(false)

  const { data: routes, error } = useQuery({
    queryKey: ['admin', 'routes'],
    queryFn: fetchRoutes,
  })

  const routeForm = useForm<RouteForm>({
    initialValues: {
      ip: '',
      mask: '',
      description: '',
    },
    validate: {
      ip: (value) => (ipPattern.test(value) ? null : t('adminConfigIpBadFormat')),
      mask: (value) => (ipPattern.test(value) ? null : t('adminConfigMaskBadFormat')),
    },
  })

  const saveRouteMutation = useMutation({
    mutationFn: async (values: RouteForm) =>
      editingRoute ? updateRoute(editingRoute.id, values) : addRoute(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'routes'] })
      setModalOpened(false)
      setRequireRestart(true)
      setEditingRoute(null)
      routeForm.reset()
    },
    onError: setLocalError,
  })

  const deleteRouteMutation = useMutation({
    mutationFn: (routeId: number) => deleteRoute(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'routes'] })
      setRequireRestart(true)
    },
    onError: setLocalError,
  })

  const operationMutation = useMutation({
    mutationFn: async (op: 'soft-restart' | 'hard-restart' | 'shutdown') => {
      if (op === 'soft-restart') return managementSoftRestart()
      if (op === 'hard-restart') return managementHardRestart()
      return managementShutdown()
    },
    onError: setLocalError,
    onSuccess: () => window.alert(t('adminConfigOperationSucceeded')),
  })

  return (
    <Stack>
      <ErrorMessage error={error ?? localError} />
      {requireRestart ? (
        <Alert color="yellow" title={t('adminConfigRestartRequiredTitle')}>
          {t('adminConfigRestartRequiredBody')}
        </Alert>
      ) : null}

      <Text fw={700} size="lg">
        {t('adminConfigRouteRules')}
      </Text>
      {routes?.length ? (
        <Table withTableBorder withColumnBorders striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>{t('commonId')}</Table.Th>
              <Table.Th>{t('adminConfigIp')}</Table.Th>
              <Table.Th>{t('adminConfigMask')}</Table.Th>
              <Table.Th>{t('adminConfigDescription')}</Table.Th>
              <Table.Th>{t('commonCreatedAt')}</Table.Th>
              <Table.Th>{t('commonUpdatedAt')}</Table.Th>
              <Table.Th>{t('commonActions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {routes.map((route, index) => (
              <Table.Tr key={route.id}>
                <Table.Td>{index + 1}</Table.Td>
                <Table.Td>{route.id}</Table.Td>
                <Table.Td>{route.ip}</Table.Td>
                <Table.Td>{route.mask}</Table.Td>
                <Table.Td>{route.description}</Table.Td>
                <Table.Td>{new Date(route.created_at).toLocaleString()}</Table.Td>
                <Table.Td>{new Date(route.modified_at).toLocaleString()}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="default"
                      onClick={() => {
                        setEditingRoute(route)
                        routeForm.setValues({ ip: route.ip, mask: route.mask, description: route.description ?? '' })
                        setModalOpened(true)
                      }}
                    >
                      {t('commonEdit')}
                    </Button>
                    <Button
                      size="xs"
                      color="red"
                      loading={deleteRouteMutation.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            t('adminConfigDeleteRouteConfirm', {
                              id: route.id,
                              ip: route.ip,
                              mask: route.mask,
                              description: route.description || '',
                            }),
                          )
                        ) {
                          deleteRouteMutation.mutate(route.id)
                        }
                      }}
                    >
                      {t('commonDelete')}
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Alert>{t('adminConfigNoRouteRule')}</Alert>
      )}

      <Group>
        <Button
          onClick={() => {
            setEditingRoute(null)
            routeForm.reset()
            setModalOpened(true)
          }}
        >
          {t('adminConfigAddRouteRule')}
        </Button>
      </Group>

      <Text fw={700}>{t('adminConfigServerOperations')}</Text>
      <Group>
        <Button
          color="yellow"
          loading={operationMutation.isPending}
          onClick={() => {
            if (
              window.confirm(t('adminConfigSoftRestartConfirm'))
            ) {
              operationMutation.mutate('soft-restart')
            }
          }}
        >
          {t('adminConfigSoftRestart')}
        </Button>
        <Button
          color="red"
          loading={operationMutation.isPending}
          onClick={() => {
            if (window.confirm(t('adminConfigHardRestartConfirm'))) {
              operationMutation.mutate('hard-restart')
            }
          }}
        >
          {t('adminConfigHardRestart')}
        </Button>
        <Button
          color="red"
          loading={operationMutation.isPending}
          onClick={() => {
            if (
              window.confirm(t('adminConfigShutdownConfirm'))
            ) {
              operationMutation.mutate('shutdown')
            }
          }}
        >
          {t('adminConfigShutdown')}
        </Button>
      </Group>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingRoute ? t('adminConfigUpdateRouteRule', { id: editingRoute.id }) : t('adminConfigNewRouteRule')}
      >
        <form onSubmit={routeForm.onSubmit((values) => saveRouteMutation.mutate(values))}>
          <Stack>
            <TextInput withAsterisk label={t('adminConfigIp')} {...routeForm.getInputProps('ip')} />
            <TextInput withAsterisk label={t('adminConfigMask')} {...routeForm.getInputProps('mask')} />
            <Textarea label={t('adminConfigDescription')} minRows={3} maxRows={5} {...routeForm.getInputProps('description')} />
            <Button type="submit" loading={saveRouteMutation.isPending}>
              {editingRoute ? t('commonSave') : t('adminConfigAddRouteRule')}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
}
