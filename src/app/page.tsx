"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Plus, User, LockKeyhole, Unlock, Users, Camera, Check, Clock, Edit3, BarChart4, Globe } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import html2canvas from "html2canvas-pro";
import ExportTemplate from "@/components/ExportTemplate";
import { Participant, COMMON_CURRENCIES, CurrencyInfo } from "@/types/types";

// Salary range options
const SALARY_RANGES = [
  { label: "$0-$25/hr", min: 0, max: 25, value: "0-25" },
  { label: "$26-$50/hr", min: 26, max: 50, value: "26-50" },
  { label: "$51-$75/hr", min: 51, max: 75, value: "51-75" },
  { label: "$76-$100/hr", min: 76, max: 100, value: "76-100" },
  { label: "$101-$150/hr", min: 101, max: 150, value: "101-150" },
  { label: "$151-$200/hr", min: 151, max: 200, value: "151-200" },
  { label: "$201-$300/hr", min: 201, max: 300, value: "201-300" },
  { label: "$301-$500/hr", min: 301, max: 500, value: "301-500" },
  { label: "$500+/hr", min: 500, max: 750, value: "500+" }, // Using an arbitrary max for calculation
];

// Common team sizes for quick setting
const COMMON_TEAM_SIZES = [
  { label: "Just me", value: 1 },
  { label: "Small huddle (2)", value: 2 },
  { label: "Team meeting (5)", value: 5 },
  { label: "Department (10)", value: 10 },
  { label: "Large group (15+)", value: 15 },
];

export default function Home() {
  // Export status
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  
  // Export configuration
  const exportTemplateRef = useRef<HTMLDivElement>(null);
  const [meetingName, setMeetingName] = useState<string>("Meeting Cost Summary");
  const [isEditingMeetingName, setIsEditingMeetingName] = useState<boolean>(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Update theme state when it changes
  useEffect(() => {
    const updateThemeState = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Set initial state
    updateThemeState();
    
    // Create a mutation observer to watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateThemeState();
        }
      });
    });
    
    // Start observing
    observer.observe(document.documentElement, { attributes: true });
    
    // Clean up
    return () => observer.disconnect();
  }, []);
  
  // Toggle between exact rates and salary ranges
  const [useExactRates, setUseExactRates] = useState<boolean>(true);

  // State for participants with individual hourly rates
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", name: "", hourlyRate: "", salaryRange: "", salaryType: "hourly" }
  ]);
  
  // State for meeting duration - default to 1 hour
  const [duration, setDuration] = useState<string>("1");
  const [timeUnit, setTimeUnit] = useState<string>("hours");
  
  // State for calculation and validation
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  
  // State for bulk participant management
  const [customParticipantCount, setCustomParticipantCount] = useState<string>("");
  const [compactView, setCompactView] = useState<boolean>(true);

  // Add state for tracking scroll and overlap
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Add currency state
  const [currency, setCurrency] = useState<CurrencyInfo>(COMMON_CURRENCIES[0]);

  // Helper function to validate inputs
  const isValidInput = (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 1; // Minimum duration is 1
  };

  // Convert salary range to hourly rate
  const getSalaryRangeMidpoint = useCallback((rangeValue: string): number => {
    const range = SALARY_RANGES.find(r => r.value === rangeValue);
    return range ? (range.min + range.max) / 2 : 0;
  }, []);

  // Helper function to calculate meeting cost
  const calculateCost = useCallback(() => {
    // Only show errors if user has interacted with the form
    if (!hasInteracted) {
      setError(null);
      return;
    }
    
    // Check if we have valid input data
    if (participants.length === 0) {
      setTotalCost(null);
      setError("Please add at least one participant");
      return;
    }

    let totalHourlyRate = 0;
    let invalidInput = false;

    // Calculate total hourly rate based on participant rates
    participants.forEach(participant => {
      if (useExactRates) {
        // Using exact hourly rates
        const rate = participant.hourlyRate.trim();
        if (rate === "" || isNaN(parseFloat(rate))) {
          invalidInput = true;
          return;
        }
        
        const inputRate = parseFloat(rate);
        let hourlyRate = inputRate;
        
        // Convert to hourly rate based on salary type
        if (participant.salaryType === "monthly") {
          // Assume 173.33 working hours per month (40 hours * 52 weeks / 12 months)
          hourlyRate = inputRate / 173.33;
        } else if (participant.salaryType === "annual") {
          // Assume 2080 working hours per year (40 hours * 52 weeks)
          hourlyRate = inputRate / 2080;
        }
        
        totalHourlyRate += hourlyRate;
      } else {
        // Using salary ranges
        const range = participant.salaryRange;
        if (!range) {
          invalidInput = true;
          return;
        }
        totalHourlyRate += getSalaryRangeMidpoint(range);
      }
    });

    // Check if the duration is valid
    const durationValue = duration.trim();
    if (durationValue === "" || isNaN(parseFloat(durationValue))) {
      setTotalCost(null);
      setError("Please enter a valid duration");
      return;
    }

    // Handle validation errors
    if (invalidInput) {
      setTotalCost(null);
      setError(useExactRates ? "Please enter valid hourly rates" : "Please select salary ranges for all participants");
      return;
    }

    // Convert duration to hours if needed
    const durationInHours = timeUnit === "hours" 
      ? parseFloat(durationValue) 
      : parseFloat(durationValue) / 60;

    // Calculate the total cost
    const cost = totalHourlyRate * durationInHours;
    setTotalCost(cost);
    setError(null);
  }, [participants, duration, timeUnit, useExactRates, hasInteracted, getSalaryRangeMidpoint]);

  // Calculate meeting cost whenever inputs change
  useEffect(() => {
    calculateCost();
  }, [participants, duration, timeUnit, useExactRates, calculateCost]);

  // Toggle between exact rates and salary ranges
  const toggleRateMode = () => {
    setUseExactRates(!useExactRates);
  };

  // Add a new participant
  const addParticipant = () => {
    // Copy the hourly rate from the last participant if available
    const lastParticipant = participants[participants.length - 1];
    const newHourlyRate = lastParticipant.hourlyRate || "";
    const newSalaryRange = lastParticipant.salaryRange || "";
    const newSalaryType = lastParticipant.salaryType || "hourly";
    
    setParticipants([
      ...participants, 
      { 
        id: Date.now().toString(), 
        name: "", 
        hourlyRate: newHourlyRate, 
        salaryRange: newSalaryRange,
        salaryType: newSalaryType
      }
    ]);
  };

  // Set a specific number of participants (replaces current list)
  const setParticipantCount = (count: number) => {
    // Get rate from first participant to apply to all new participants
    const existingRate = participants[0]?.hourlyRate || "";
    const existingSalaryRange = participants[0]?.salaryRange || "";
    const existingSalaryType = participants[0]?.salaryType || "hourly";
    
    // Preserve existing participants up to the count
    const existingToKeep = participants.slice(0, count);
    
    // Create new participants if needed
    const additionalNeeded = count - existingToKeep.length;
    const newParticipants = additionalNeeded > 0 
      ? Array.from({ length: additionalNeeded }, (_, index) => ({
          id: (Date.now() + index).toString(),
          name: "",
          hourlyRate: existingRate,
          salaryRange: existingSalaryRange,
          salaryType: existingSalaryType
        }))
      : [];
    
    setParticipants([...existingToKeep, ...newParticipants]);
  };

  // Handle custom participant count set
  const handleSetCustomParticipants = () => {
    const count = parseInt(customParticipantCount);
    if (!isNaN(count) && count > 0) {
      setParticipantCount(count);
      setCustomParticipantCount("");
    }
  };

  // Remove a participant
  const removeParticipant = (id: string) => {
    if (participants.length > 1) {
      setParticipants(participants.filter(p => p.id !== id));
    }
  };

  // Update participant details
  const updateParticipant = (id: string, field: keyof Participant, value: string) => {
    setHasInteracted(true);
    setParticipants(
      participants.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  };

  // Update all participants with the same rate
  const applyRateToAll = (value: string) => {
    setHasInteracted(true);
    if (useExactRates) {
      setParticipants(
        participants.map(p => ({ ...p, hourlyRate: value }))
      );
    } else {
      setParticipants(
        participants.map(p => ({ ...p, salaryRange: value }))
      );
    }
  };

  // Handle duration change with validation
  const handleDurationChange = (value: string) => {
    setHasInteracted(true);
    // Allow empty string for UX
    if (value === "") {
      setDuration(value);
      return;
    }
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // Ensure minimum value of 1
      if (numValue < 1) {
        setDuration("1");
      } else {
        setDuration(value);
      }
    }
  };

  // Export the result as a high-quality image
  const exportAsImage = async (format: 'png' | 'jpg' = 'png') => {
    if (!exportTemplateRef.current) return;

    try {
      setExportStatus('Preparing...');
      
      // Force update the dark mode state before export
      const currentIsDarkMode = document.documentElement.classList.contains('dark');
      setIsDarkMode(currentIsDarkMode);
      
      // Temporarily hide any scrollbars
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      // Take screenshot with html2canvas-pro at high resolution
      setExportStatus('Capturing...');
      
      const canvas = await html2canvas(exportTemplateRef.current, {
        scale: 3, // Higher resolution (3x)
        useCORS: true,
        allowTaint: true,
        backgroundColor: currentIsDarkMode ? '#1e1e2e' : '#ffffff',
        logging: false,
        // Improve rendering quality
        imageTimeout: 0,
        ignoreElements: (element) => {
          // Ignore any hidden elements that might cause problems
          const style = window.getComputedStyle(element);
          return style.display === 'none' || style.visibility === 'hidden';
        },
        onclone: (clonedDoc) => {
          // Set darkmode class on the cloned document to preserve theme
          if (currentIsDarkMode) {
            clonedDoc.documentElement.classList.add('dark');
          } else {
            clonedDoc.documentElement.classList.remove('dark');
          }
          
          // Force all oklch colors to be applied properly in the cloned document
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            // This forces a reflow/repaint with all styles applied
            if (el instanceof HTMLElement) {
              void el.offsetHeight;
            }
          });
          return clonedDoc;
        }
      });
      
      // Restore original body style
      document.body.style.overflow = originalOverflow;
      
      // Convert to data URL and download
      setExportStatus('Downloading...');
      
      let dataUrl;
      if (format === 'png') {
        dataUrl = canvas.toDataURL('image/png');
      } else {
        dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      }
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `meeting-cost-${meetingName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.${format}`;
      link.click();
      
      setExportStatus('Saved!');
      setTimeout(() => setExportStatus(null), 2000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('Export failed');
      setTimeout(() => setExportStatus(null), 2000);
    }
  };

  // Calculate individual cost for a participant
  const calculateIndividualCost = (participant: Participant): number => {
    if (!duration) return 0;
    
    const timeDuration = parseFloat(duration);
    let hourlyRate = 0;
    
    if (useExactRates) {
      const inputRate = parseFloat(participant.hourlyRate || "0");
      
      // Convert to hourly rate based on salary type
      if (participant.salaryType === "hourly") {
        hourlyRate = inputRate;
      } else if (participant.salaryType === "monthly") {
        // Assume 173.33 working hours per month (40 hours * 52 weeks / 12 months)
        hourlyRate = inputRate / 173.33;
      } else if (participant.salaryType === "annual") {
        // Assume 2080 working hours per year (40 hours * 52 weeks)
        hourlyRate = inputRate / 2080;
      }
    } else {
      hourlyRate = getSalaryRangeMidpoint(participant.salaryRange);
    }
    
    return timeUnit === "hours" 
      ? hourlyRate * timeDuration 
      : hourlyRate * (timeDuration / 60);
  };

  // Format money for display with appropriate precision and currency
  const formatMoney = (amount: number): string => {
    // Format with the selected currency using Intl.NumberFormat
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: amount < 100 || amount % 1 > 0.01 ? 2 : 0,
      maximumFractionDigits: amount < 100 || amount % 1 > 0.01 ? 2 : 0,
    });
    
    return formatter.format(amount);
  };

  // Format a number with thousand separators for placeholder text
  const formatPlaceholder = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Get participant rate display with currency
  const getParticipantRateDisplay = (participant: Participant) => {
    if (useExactRates) {
      if (!participant.hourlyRate) return "Not set";
      
      const rate = parseFloat(participant.hourlyRate);
      
      if (participant.salaryType === "hourly") {
        return `${currency.symbol}${rate}/hr`;
      } else if (participant.salaryType === "monthly") {
        return `${currency.symbol}${rate}/mo`;
      } else {
        return `${currency.symbol}${rate}/yr`;
      }
    } else {
      const range = SALARY_RANGES.find(r => r.value === participant.salaryRange);
      return range ? range.label.replace('$', currency.symbol) : "Not set";
    }
  };

  // Convert a rate to hourly for display with currency
  const convertToHourlyForDisplay = (participant: Participant): string => {
    if (!participant.hourlyRate || participant.hourlyRate === "0" || participant.hourlyRate === "") return "--";
    
    const rate = parseFloat(participant.hourlyRate);
    
    if (participant.salaryType === "hourly") {
      return `${currency.symbol}${rate.toFixed(2)}/hr`;
    } else if (participant.salaryType === "monthly") {
      const hourly = rate / 173.33;
      return `${currency.symbol}${hourly.toFixed(2)}/hr`;
    } else if (participant.salaryType === "annual") {
      const hourly = rate / 2080;
      return `${currency.symbol}${hourly.toFixed(2)}/hr`;
    }
    
    return "--";
  };

  // Toggle compact view
  const toggleCompactView = () => {
    setCompactView(!compactView);
  };

  // Clear calculation for person-hours
  const calculatePersonHours = (): string => {
    if (!duration || !isValidInput(duration) || !participants.length) return "0";
    
    const timeDuration = parseFloat(duration);
    
    // For hours, multiply participants by hours
    // For minutes, convert to hours first (minutes / 60) then multiply by participants
    const totalHours = timeUnit === "hours" 
      ? timeDuration * participants.length 
      : (timeDuration / 60) * participants.length;
    
    // Format with one decimal place if there's a fractional part
    return totalHours % 1 === 0 ? totalHours.toString() : totalHours.toFixed(1);
  };

  // Add scroll event listener with improved detection
  useEffect(() => {
    const handleScroll = () => {
      // When scrolled beyond a threshold, apply the frosted glass effect
      const scrollPosition = window.scrollY;
      const screenHeight = window.innerHeight;
      const contentHeight = document.body.scrollHeight;
      
      // Apply effect when scrolled down or when content is tall enough to warrant it
      const shouldApplyEffect = scrollPosition > 100 || 
                              (contentHeight > screenHeight * 1.5 && scrollPosition > 50);
      
      setIsScrolled(shouldApplyEffect);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Initial check
    handleScroll();
    
    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-8 bg-background relative">
      {/* Theme Toggle - Fixed position with conditional frosted glass effect */}
      <div className={`theme-toggle-container 
        ${isScrolled ? 'frosted-glass' : ''} 
        top-auto bottom-4 right-4 sm:top-4 sm:bottom-auto sm:right-4`}>
        <ThemeToggle />
      </div>
      
      {/* Hidden export template for high-quality image capture */}
      <div className="fixed left-[-9999px] top-0 overflow-hidden">
        <ExportTemplate
          ref={exportTemplateRef}
          participants={participants}
          totalCost={totalCost}
          duration={duration}
          timeUnit={timeUnit}
          calculateIndividualCost={calculateIndividualCost}
          calculatePersonHours={calculatePersonHours}
          formatMoney={formatMoney}
          meetingName={meetingName}
          isDarkMode={isDarkMode}
          currency={currency}
        />
      </div>
    
      <Card className="w-full max-w-4xl relative" variant="borderless">
        <CardHeader className="pb-2 sm:pb-4 px-4 sm:px-6">
          <div className="flex flex-col items-center">
            <CardTitle className="text-center text-2xl sm:text-3xl font-bold tracking-tight">Timeloss</CardTitle>
            <CardDescription className="text-center mb-2 text-sm sm:text-base opacity-80">
              Calculate the true cost of your meetings
            </CardDescription>
          </div>
          
          {/* Currency selection */}
          <div className="flex justify-center mt-2">
            <Select
              value={currency.code}
              onValueChange={(value) => {
                const newCurrency = COMMON_CURRENCIES.find(c => c.code === value);
                if (newCurrency) setCurrency(newCurrency);
              }}
            >
              <SelectTrigger className="w-auto h-8 px-3 rounded-full text-xs flex items-center gap-1">
                <Globe className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_CURRENCIES.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.name} ({curr.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-8 pt-2 pb-6 sm:pb-8 space-y-8 sm:space-y-10">
          {/* Step 1: Meeting Duration */}
          <div className="w-full">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                <Clock className="h-4 sm:h-5 w-4 sm:w-5 mr-1" /> Set Meeting Duration
              </h2>
            </div>
            
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-muted/10 p-4 sm:p-6 rounded-xl">
              <Label htmlFor="duration" className="text-sm sm:text-base font-medium whitespace-nowrap">Duration:</Label>
              <div className="flex items-center w-full sm:w-auto mt-1 sm:mt-0">
                <Input
                  id="duration"
                  type="number"
                  placeholder="1"
                  value={duration}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  min="1"
                  step="1"
                  className="w-24 h-10 rounded-lg text-base sm:text-lg"
                />
                
                <Select value={timeUnit} onValueChange={setTimeUnit}>
                  <SelectTrigger id="timeUnit" className="w-28 sm:w-32 h-10 ml-2 rounded-lg text-base sm:text-lg">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="minutes">Minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Step 2: Meeting Participants */}
          <div className="w-full">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-primary text-primary-foreground text-sm">2</span>
                <Users className="h-4 sm:h-5 w-4 sm:w-5 mr-1" /> Add Participants
              </h2>
            </div>
            
            <div className="bg-muted/10 p-4 sm:p-6 rounded-xl">
              {/* Privacy mode toggle */}
              <div className="flex flex-col space-y-2 mb-4 border-b pb-4 border-border/30">
                <div className="flex items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant={useExactRates ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-1 px-3 sm:px-5 py-2 h-9 rounded-full transition-all duration-200 ease-in-out"
                    onClick={toggleRateMode}
                  >
                    <Unlock className="h-4 w-4 mr-1" />
                    <span className="whitespace-nowrap">Exact Rates</span>
                  </Button>
                  <Button
                    type="button"
                    variant={!useExactRates ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-1 px-3 sm:px-5 py-2 h-9 rounded-full transition-all duration-200 ease-in-out"
                    onClick={toggleRateMode}
                  >
                    <LockKeyhole className="h-4 w-4 mr-1" />
                    <span className="whitespace-nowrap">Privacy Mode</span>
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground text-center transition-opacity duration-200 ease-in-out">
                  {!useExactRates ? "Privacy mode uses salary ranges instead of exact figures" : "Exact rates mode uses precise hourly costs"}
                </p>
              </div>
              
              {/* Team size quick selection */}
              <div className="grid grid-cols-1 gap-5 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="quickSet" className="text-sm block font-medium">Team style:</Label>
                  <Select onValueChange={(val) => {
                    setParticipantCount(parseInt(val));
                  }}>
                    <SelectTrigger id="quickSet" className="w-full rounded-lg">
                      <SelectValue placeholder="Choose size" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_TEAM_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value.toString()}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm block font-medium">Exact number:</Label>
                  <div className="flex items-center w-full">
                    <Input
                      type="number"
                      placeholder="e.g. 8"
                      value={customParticipantCount}
                      onChange={(e) => setCustomParticipantCount(e.target.value)}
                      min="1"
                      className="rounded-lg"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSetCustomParticipants}
                      disabled={!customParticipantCount || parseInt(customParticipantCount) <= 0}
                      className="flex items-center gap-1 ml-2 rounded-lg"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Set
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-center sm:justify-start mt-2">
                  <Button 
                    type="button" 
                    variant="default" 
                    onClick={addParticipant}
                    className="flex items-center gap-1 rounded-full w-full sm:w-auto"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Person
                  </Button>
                </div>
              </div>
              
              {/* Bulk rate setting */}
              <div className="p-3 sm:p-4 rounded-xl mb-4 bg-muted/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center w-full sm:w-auto">
                    <Label className="whitespace-nowrap flex items-center gap-1 text-sm font-medium">
                      <span>{useExactRates ? "Everyone's salary:" : "Everyone's in range:"}</span>
                    </Label>
                  </div>
                  
                  <div className="w-full sm:flex-1 transition-all duration-200 ease-in-out">
                    {useExactRates ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 animate-in fade-in duration-200 w-full">
                        <Select
                          value={participants[0]?.salaryType || "hourly"}
                          onValueChange={(value: "hourly" | "monthly" | "annual") => {
                            // Apply this salary type to all participants
                            setParticipants(
                              participants.map(p => ({ ...p, salaryType: value }))
                            );
                          }}
                        >
                          <SelectTrigger className="w-full sm:w-28 rounded-lg">
                            <SelectValue placeholder="Salary Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="flex items-center w-full">
                          <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                              <span className="text-sm text-muted-foreground">{currency.symbol}</span>
                            </div>
                            <Input
                              id={`rate-${participants[0]?.id}`}
                              type="number"
                              placeholder={participants[0]?.salaryType === "hourly" ? "e.g., 50" : 
                                                  participants[0]?.salaryType === "monthly" ? `e.g., ${formatPlaceholder(5000)}` : 
                                                  `e.g., ${formatPlaceholder(60000)}`}
                              value={participants[0]?.hourlyRate}
                              onChange={(e) => {
                                if (e.target.value) applyRateToAll(e.target.value);
                              }}
                              min="1"
                              step="1"
                              className="w-full rounded-md h-8 text-sm pl-7"
                            />
                          </div>
                          {participants[0]?.hourlyRate && (
                            <div className="ml-2 text-xs text-muted-foreground whitespace-nowrap">
                              {convertToHourlyForDisplay(participants[0])}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="animate-in fade-in duration-200 w-full">
                        <Select
                          onValueChange={(value) => applyRateToAll(value)}
                        >
                          <SelectTrigger className="w-full sm:max-w-60 rounded-lg">
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                          <SelectContent>
                            {SALARY_RANGES.map((range) => (
                              <SelectItem key={range.value} value={range.value}>
                                {range.label.replace('$', currency.symbol)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full sm:w-auto text-center sm:text-left">
                    <p className="text-xs text-muted-foreground">
                      {participants.length > 1 && "Applies to all " + participants.length + " attendees"}
                    </p>
                  </div>
                </div>
                
                {useExactRates && (
                  <p className="text-xs text-muted-foreground text-center italic mt-3">
                    Enter your hourly, monthly, or annual salary. 
                    Monthly is converted to hourly at 173.33 hours/month (40hr weeks), 
                    annual at 2080 hours/year.
                  </p>
                )}
              </div>
              
              {/* Participant details */}
              <div className="border-t border-border/30 pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h3 className="font-medium">Participant Details</h3>
                  <div className="flex items-center gap-2">
                    <Select
                      value={participants[0]?.salaryType || "hourly"}
                      onValueChange={(value: "hourly" | "monthly" | "annual") => {
                        // Apply this salary type to all participants
                        setParticipants(
                          participants.map(p => ({ ...p, salaryType: value }))
                        );
                      }}
                    >
                      <SelectTrigger className="w-28 h-7 text-xs rounded-full">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={toggleCompactView}
                      className="flex items-center gap-1 rounded-full text-xs px-3 py-1 h-7"
                    >
                      {compactView ? "Detailed View" : "Compact View"}
                    </Button>
                  </div>
                </div>
                
                <div className="mt-2 space-y-2">
                  {participants.map((participant, index) => (
                    <div key={participant.id} className="bg-muted/5 rounded-lg relative">
                      {compactView ? (
                        // Compact View - Ultra space efficient
                        <div className="flex items-center justify-between gap-1 p-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="text-sm truncate">
                              {participant.name || `Person ${index + 1}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="text-sm font-medium block">
                                {useExactRates 
                                  ? (participant.hourlyRate ? getParticipantRateDisplay(participant) : '--') 
                                  : (SALARY_RANGES.find(r => r.value === participant.salaryRange)?.label || '--').replace('$', currency.symbol)}
                              </span>
                              {useExactRates && participant.hourlyRate && (
                                <span className="text-xs text-muted-foreground">
                                  {convertToHourlyForDisplay(participant)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-primary h-7 w-7 rounded-full p-0 flex items-center justify-center shrink-0"
                                onClick={() => {
                                  // Open this participant for editing in full view
                                  setCompactView(false);
                                }}
                                aria-label="Edit participant"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-red-500 h-7 w-7 rounded-full p-0 flex items-center justify-center shrink-0"
                                onClick={() => removeParticipant(participant.id)}
                                disabled={participants.length === 1}
                                aria-label="Remove participant"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Regular View - More detailed editing
                        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 p-2">
                          {/* Name field - Full width on mobile, first column on desktop */}
                          <div className="w-full">
                            <Label htmlFor={`name-${participant.id}`} className="text-xs mb-1 block">Name (Optional)</Label>
                            <div className="flex items-center h-9">
                              <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              <Input
                                id={`name-${participant.id}`}
                                value={participant.name}
                                onChange={(e) => updateParticipant(participant.id, "name", e.target.value)}
                                placeholder={`Person ${index + 1}`}
                                className="w-full rounded-md h-8 text-sm"
                              />
                            </div>
                          </div>
                          
                          {/* Rate field - Full width on mobile, second column on desktop */}
                          <div className="w-full">
                            {useExactRates ? (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label htmlFor={`rate-${participant.id}`} className="text-xs block">
                                    {participant.salaryType === "hourly" ? "Hourly Rate" :
                                     participant.salaryType === "monthly" ? "Monthly Salary" : 
                                     "Annual Salary"}
                                  </Label>
                                  <Select
                                    value={participant.salaryType}
                                    onValueChange={(value: "hourly" | "monthly" | "annual") => 
                                      updateParticipant(participant.id, "salaryType", value)
                                    }
                                  >
                                    <SelectTrigger className="w-28 h-6 text-xs rounded-md">
                                      <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="hourly">Hourly</SelectItem>
                                      <SelectItem value="monthly">Monthly</SelectItem>
                                      <SelectItem value="annual">Annual</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center">
                                  <div className="relative flex-grow">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                                      <span className="text-sm text-muted-foreground">{currency.symbol}</span>
                                    </div>
                                    <Input
                                      id={`rate-${participant.id}`}
                                      type="number"
                                      placeholder={participant.salaryType === "hourly" ? "e.g., 50" : 
                                                  participant.salaryType === "monthly" ? `e.g., ${formatPlaceholder(5000)}` : 
                                                  `e.g., ${formatPlaceholder(60000)}`}
                                      value={participant.hourlyRate}
                                      onChange={(e) => updateParticipant(participant.id, "hourlyRate", e.target.value)}
                                      min="1"
                                      step="1"
                                      className="w-full rounded-md h-8 text-sm pl-7"
                                    />
                                  </div>
                                  {participant.hourlyRate && (
                                    <div className="ml-2 text-xs text-muted-foreground whitespace-nowrap">
                                      {convertToHourlyForDisplay(participant)}
                                    </div>
                                  )}
                                </div>
                                {participant.salaryType !== "hourly" && participant.hourlyRate && (
                                  <div className="mt-1 text-xs flex items-center">
                                    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5">
                                      = {convertToHourlyForDisplay(participant)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <Label htmlFor={`range-${participant.id}`} className="text-xs mb-1 block">Salary Range</Label>
                                <Select
                                  value={participant.salaryRange}
                                  onValueChange={(value) => updateParticipant(participant.id, "salaryRange", value)}
                                >
                                  <SelectTrigger id={`range-${participant.id}`} className="w-full rounded-md h-8 text-sm">
                                    <SelectValue placeholder="Select range" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SALARY_RANGES.map((range) => (
                                      <SelectItem key={range.value} value={range.value}>
                                        {range.label.replace('$', currency.symbol)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                          
                          {/* Delete button - Aligned right on all screens */}
                          <div className="flex items-center justify-end sm:justify-center h-8 mt-auto">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-red-500 h-8 w-8 rounded-full p-0 flex items-center justify-center"
                              onClick={() => removeParticipant(participant.id)}
                              disabled={participants.length === 1}
                              aria-label="Remove participant"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Step 3: Results */}
          <div className="w-full">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-primary text-primary-foreground text-sm">3</span>
                <BarChart4 className="h-4 sm:h-5 w-4 sm:w-5 mr-1" /> Meeting Cost Results
              </h2>
            </div>
            
            <div className="bg-muted/10 p-4 sm:p-6 rounded-xl">
              {/* Cost display */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8 mb-6 bg-background/40 p-4 sm:p-6 rounded-xl shadow-sm">
                <div className="p-2 sm:p-3 rounded-xl text-center sm:text-left">
                  <h3 className="font-medium text-base sm:text-lg mb-1">Total Meeting Cost</h3>
                  <p className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
                    {currency.symbol}{totalCost !== null ? formatMoney(totalCost) : "0"}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {participants.length} {participants.length === 1 ? 'person' : 'people'} × {duration || '1'} {timeUnit}
                  </p>
                  {totalCost !== null && timeUnit === "hours" && (
                    <p className="text-xs text-primary-foreground/70 mt-2 bg-primary/10 px-2 py-1 rounded-md inline-block">
                      {currency.symbol}{formatMoney(totalCost / (parseFloat(duration) || 1))}/hr
                    </p>
                  )}
                  {totalCost !== null && timeUnit === "minutes" && (
                    <p className="text-xs text-primary-foreground/70 mt-2 bg-primary/10 px-2 py-1 rounded-md inline-block">
                      {currency.symbol}{formatMoney(totalCost / (parseFloat(duration) || 1))}/min
                    </p>
                  )}
                </div>
                
                <div className="text-center sm:text-right p-2 sm:p-3 rounded-xl">
                  <h3 className="font-medium text-base sm:text-lg mb-1">Per Person Average</h3>
                  <p className="text-2xl sm:text-3xl font-semibold tracking-tight">
                    {currency.symbol}{totalCost !== null && participants.length > 0 
                      ? formatMoney(totalCost / participants.length) 
                      : "0"}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Total person-hours: {calculatePersonHours()}
                  </p>
                  {totalCost !== null && participants.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/20 px-2 py-1 rounded-md inline-block">
                      {timeUnit === "hours" 
                        ? `${currency.symbol}${formatMoney((totalCost / participants.length) / (parseFloat(duration) || 1))}/hr per person`
                        : `${currency.symbol}${formatMoney((totalCost / participants.length) / (parseFloat(duration) || 1))}/min per person`
                      }
                    </p>
                  )}
                </div>
              </div>
              
              {/* Meeting name and export */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 mb-4 border-t border-b py-4 border-border/30">
                <div className="w-full sm:w-auto">
                  {isEditingMeetingName ? (
                    <div className="flex items-center">
                      <Input
                        value={meetingName}
                        onChange={(e) => setMeetingName(e.target.value)}
                        className="h-10 w-full sm:w-64 rounded-lg"
                        placeholder="Meeting name for export"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-10 w-10 p-0 ml-1"
                        onClick={() => setIsEditingMeetingName(false)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-10 gap-1 px-4 text-base w-full sm:w-auto justify-center sm:justify-start"
                      onClick={() => setIsEditingMeetingName(true)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" /> {meetingName}
                    </Button>
                  )}
                </div>
                
                <Button
                  type="button"
                  size="default"
                  variant="default"
                  className="export-button-glass h-10 gap-1 px-6 py-2 w-full sm:w-auto font-medium"
                  onClick={() => exportAsImage('png')}
                  disabled={!!exportStatus}
                >
                  {exportStatus ? exportStatus : <>
                    <Camera className="h-5 w-5 mr-2" /> Export as Image
                  </>}
                </Button>
              </div>
              
              {/* Cost breakdown */}
              {totalCost !== null && participants.length > 0 && (
                <div className="w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                    <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-0">
                      Cost Breakdown
                    </h3>
                    {!useExactRates && (
                      <p className="text-xs text-muted-foreground italic">
                        *Using midpoint of each range for calculations
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {participants.map((participant) => {
                      // Skip if no valid rate info
                      if ((useExactRates && !participant.hourlyRate) || 
                          (!useExactRates && !participant.salaryRange)) {
                        return null;
                      }
                      
                      const individualCost = calculateIndividualCost(participant);
                      const rateDisplay = getParticipantRateDisplay(participant);
                      
                      return (
                        <div key={participant.id} className="flex justify-between text-sm p-3 rounded-lg bg-background/40">
                          <span className="font-medium">
                            {participant.name || `Person ${participants.indexOf(participant) + 1}`} 
                            <span>
                              ({rateDisplay}
                              {useExactRates && participant.salaryType !== "hourly" && participant.hourlyRate && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ~{convertToHourlyForDisplay(participant)}
                                </span>
                              )})
                            </span>
                          </span>
                          <span className="font-bold">{currency.symbol}{formatMoney(individualCost)}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {participants.length > 2 && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-4 p-3 rounded text-center bg-background/40">
                      That&apos;s {currency.symbol}{formatMoney(totalCost / 60)} per minute for this group
                    </p>
                  )}
                </div>
              )}
              
              {useExactRates && participants.some(p => p.salaryType !== "hourly" && p.hourlyRate) && (
                <div className="mt-4 text-xs text-muted-foreground p-3 rounded text-center bg-background/40">
                  <span className="font-medium">Note:</span> Monthly salaries are converted to hourly at 173.33 hours/month (40hr weeks), 
                  annual salaries at 2080 hours/year. This ensures accurate meeting costs regardless of how you enter your salary.
                </div>
              )}
            </div>
          </div>
          
          {error && hasInteracted && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 sm:p-4 rounded-lg">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="px-4 sm:px-8 py-3 sm:py-4 flex justify-center border-t">
          <p className="text-xs text-muted-foreground text-center">
            Timeloss helps you visualize the real cost of meetings and make informed decisions.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}