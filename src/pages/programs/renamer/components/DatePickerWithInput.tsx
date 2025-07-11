"use client"

import * as React from "react"
import { format, parse } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Row } from "@tanstack/react-table"
import { FileEntry } from "../types"

interface DatePickerWithInputProps {
  row: Row<FileEntry>
  onDateChange: (entry: FileEntry, date: Date) => void
}

export function DatePickerWithInput({ row, onDateChange }: DatePickerWithInputProps): React.ReactElement {
  const { date: timestamp } = row.original
  const [date, setDate] = React.useState<Date | undefined>(new Date(timestamp))
  const [inputValue, setInputValue] = React.useState<string>(format(new Date(timestamp), "yyMMdd"))
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  // Update input value when date changes
  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, "yyMMdd"));
    }
  }, [date]);

  const handleDateSelect = (newDate: Date | undefined): void => {
    if (newDate) {
      setDate(newDate)
      onDateChange(row.original, newDate)
      setPopoverOpen(false); // Close popover on selection
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setInputValue(value);
    // Only parse if the format is complete
    if (value.length === 6) {
        try {
            const parsedDate = parse(value, "yyMMdd", new Date());
            if (!isNaN(parsedDate.getTime())) {
                setDate(parsedDate);
                onDateChange(row.original, parsedDate);
            }
        } catch (error) {
            // Ignore invalid date strings
        }
    }
  }

  return (
    <div className="flex items-center">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        className="w-[80px] h-6 p-1 text-sm"
        maxLength={6}
      />
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            size="sm"
            className={cn(
              "h-6 w-6 p-0 ml-1",
              !date && "text-muted-foreground"
            )}
            data-interactive="true"
          >
            <CalendarIcon className="h-3 w-3" />
            <span className="sr-only">Open calendar</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
