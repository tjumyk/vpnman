import { useEffect } from 'react'
import { useIsFetching } from '@tanstack/react-query'
import { nprogress } from '@mantine/nprogress'

export function QueryProgressIndicator(): React.ReactElement | null {
  const isFetching = useIsFetching()

  useEffect(() => {
    if (isFetching > 0) nprogress.start()
    else nprogress.complete()
  }, [isFetching])

  return null
}
