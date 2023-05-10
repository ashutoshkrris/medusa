import { AdminGetInventoryItemsParams, ProductVariant } from "@medusajs/medusa"
import { ControlProps, OptionProps, SingleValue } from "react-select"
import { InventoryItemDTO, InventoryLevelDTO } from "@medusajs/types"

import Control from "../select/next-select/components/control"
import { NextSelect } from "../select/next-select"
import React from "react"
// TODO: Fix this
import SearchIcon from "../../fundamentals/icons/search-icon"
import { useAdminInventoryItems } from "medusa-react"
import { useDebounce } from "../../../hooks/use-debounce"
import { useState } from "react"

type Props = {
  onItemSelect: (item: itemType) => void
  clearOnSelect?: boolean
  filters?: AdminGetInventoryItemsParams
}

type itemType = Partial<InventoryItemDTO> & {
  location_levels?: InventoryLevelDTO[] | undefined
  variants?: ProductVariant[] | undefined
}

type ItemOption = {
  label: string | undefined
  value: string | undefined
  inventoryItem: itemType
}

const ItemSearch = ({ onItemSelect, clearOnSelect, filters = {} }: Props) => {
  const [itemSearchTerm, setItemSearchTerm] = useState<string | undefined>()

  const debouncedItemSearchTerm = useDebounce(itemSearchTerm, 500)

  const queryEnabled = !!debouncedItemSearchTerm?.length

  const { isLoading, inventory_items } = useAdminInventoryItems(
    {
      q: debouncedItemSearchTerm,
      ...filters,
    },
    { enabled: queryEnabled }
  )

  const onChange = (item: SingleValue<ItemOption>) => {
    if (item) {
      onItemSelect(item.inventoryItem)
    }
  }

  const options = inventory_items?.map((inventoryItem) => ({
    label: inventoryItem.title || undefined,
    value: inventoryItem.id,
    inventoryItem,
  })) as ItemOption[]

  return (
    <div>
      <NextSelect
        isMulti={false}
        components={{ Option: ProductOption, Control: SearchControl }}
        onInputChange={setItemSearchTerm}
        options={options}
        placeholder="Choose an item"
        isSearchable={true}
        noOptionsMessage={() => "No items found"}
        openMenuOnClick={!!inventory_items?.length}
        onChange={onChange}
        value={null}
        isLoading={queryEnabled && isLoading}
      />
    </div>
  )
}

const ProductOption = ({
  innerProps,
  isDisabled,
  data,
}: OptionProps<ItemOption>) => {
  const { available, inStock } = React.useMemo(() => {
    return (data.inventoryItem.location_levels || []).reduce(
      (acc, curr) => {
        return {
          available:
            acc.available + (curr.stocked_quantity - curr.reserved_quantity),
          inStock: acc.inStock + curr.stocked_quantity,
        }
      },
      { available: 0, inStock: 0 }
    )
  }, [data.inventoryItem.location_levels])

  return (
    <div
      {...innerProps}
      className="text-small grid w-full cursor-pointer grid-cols-2 place-content-between px-4 py-2 transition-all hover:bg-gray-50"
    >
      <div>
        <p>{data.label}</p>
        <p className="text-grey-50">{data.inventoryItem.sku}</p>
      </div>
      <div className="text-right">
        <p className="text-grey-50">{`${inStock} stock`}</p>
        <p className="text-grey-50">{`${available} available`}</p>
      </div>
    </div>
  )
}

const SearchControl = ({ children, ...props }: ControlProps<ItemOption>) => (
  <Control {...props}>
    <span className="mr-4">
      <SearchIcon size={16} className="text-grey-50" />
    </span>
    {children}
  </Control>
)

export default ItemSearch
