'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import { cn } from '~/utils'
import { Button } from '~/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '~/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { useFetcher } from '@remix-run/react'
import type { loader } from '~/routes/api.keywords'
import type { Keyword } from '@prisma/client'
import { Separator } from './ui/separator'
import { Label } from './ui/label'
import { useField } from 'remix-validated-form'
import { ErrorMessage } from './typography'

let keywordCache: Record<string, Keyword> = {}

export function Combobox() {
  let [open, setOpen] = React.useState(false)
  let [value, setValue] = React.useState('')
  let [search, setSearch] = React.useState('')

  let fetcher = useFetcher<typeof loader>()

  React.useEffect(() => {
    fetcher.load(`/api/keywords?q=${search}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  React.useEffect(() => {
    if (!fetcher.data) return

    for (let keyword of fetcher.data) {
      keywordCache[keyword.id] = keyword
    }
  }, [fetcher.data])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? keywordCache[value].title : 'Select keyword...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search keywords..."
          />
          <CommandEmpty>No keywords found.</CommandEmpty>
          <CommandGroup>
            {fetcher.data?.map(keyword => (
              <CommandItem
                key={keyword.id}
                value={keyword.id}
                onSelect={currentValue => {
                  setValue(currentValue === value ? '' : currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === keyword.title ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {keyword.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function MultiCombobox({
  label,
  name,
}: {
  label: string
  name: string
}) {
  let [open, setOpen] = React.useState(false)
  let [value, setValue] = React.useState<string[]>([])
  let [search, setSearch] = React.useState('')
  let { error } = useField(name)
  let id = React.useId()

  let fetcher = useFetcher<typeof loader>()

  React.useEffect(() => {
    fetcher.load(`/api/keywords?q=${search}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  React.useEffect(() => {
    if (!fetcher.data) return

    for (let keyword of fetcher.data) {
      keywordCache[keyword.id] = keyword
    }
  }, [fetcher.data])

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {value.map((kw, i) => (
        <input key={kw} type="hidden" name={`${name}[${i}]`} value={kw} />
      ))}
      <div className="mb-1.5 flex gap-1.5">
        {value.map(v => (
          <Button
            onClick={() => {
              setValue(current => current.filter(c => c !== v))
            }}
            type="button"
            key={v}
            size="sm"
            variant="secondary"
          >
            {keywordCache[v].title}
            <Separator orientation="vertical" className="h-[16px] mx-2" />
            <X className="w-4 h-4" />
          </Button>
        ))}
      </div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger id={id} asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            Select keywords...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
          <Command shouldFilter={false}>
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search keywords..."
            />
            <CommandEmpty>No keywords found.</CommandEmpty>
            <CommandGroup>
              {fetcher.data?.map(keyword => (
                <CommandItem
                  key={keyword.id}
                  value={keyword.id}
                  onSelect={newValue => {
                    setValue(currentValue =>
                      currentValue.includes(newValue)
                        ? currentValue.filter(v => v !== newValue)
                        : [...currentValue, newValue],
                    )
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value.includes(keyword.id) ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {keyword.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
