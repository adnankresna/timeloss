"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Plus, User, LockKeyhole, Unlock, Users, Camera, Check, Clock, Edit3, BarChart4 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import html2canvas from "html2canvas-pro";
import ExportTemplate from "@/components/ExportTemplate";
import { Participant } from "@/types/types";

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
    { id: "1", name: "", hourlyRate: "", salaryRange: "" }
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
  const [showParticipantDetails, setShowParticipantDetails] = useState<boolean>(true);

  // Helper function to validate inputs
  const isValidInput = (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 1; // Minimum duration is 1
  };

  // Helper function to calculate meeting cost
  const calculateCost = () => {
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
        totalHourlyRate += parseFloat(rate);
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
  };

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
    
    setParticipants([
      ...participants, 
      { 
        id: Date.now().toString(), 
        name: "", 
        hourlyRate: newHourlyRate, 
        salaryRange: newSalaryRange 
      }
    ]);
  };

  // Set a specific number of participants (replaces current list)
  const setParticipantCount = (count: number) => {
    // Get rate from first participant to apply to all new participants
    const existingRate = participants[0]?.hourlyRate || "";
    const existingSalaryRange = participants[0]?.salaryRange || "";
    
    // Preserve existing participants up to the count
    const existingToKeep = participants.slice(0, count);
    
    // Create new participants if needed
    const additionalNeeded = count - existingToKeep.length;
    const newParticipants = additionalNeeded > 0 
      ? Array.from({ length: additionalNeeded }, (_, index) => ({
          id: (Date.now() + index).toString(),
          name: "",
          hourlyRate: existingRate,
          salaryRange: existingSalaryRange
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
    let rate = 0;
    
    if (useExactRates) {
      rate = parseFloat(participant.hourlyRate || "0");
    } else {
      rate = getSalaryRangeMidpoint(participant.salaryRange);
    }
    
    return timeUnit === "hours" 
      ? rate * timeDuration 
      : rate * (timeDuration / 60);
  };

  // Get the midpoint of a salary range for calculation
  const getSalaryRangeMidpoint = (rangeValue: string): number => {
    const range = SALARY_RANGES.find(r => r.value === rangeValue);
    if (!range) return 0;
    return (range.min + range.max) / 2;
  };

  // Generate a display label for a participant's rate
  const getParticipantRateDisplay = (participant: Participant) => {
    if (useExactRates) {
      return `$${participant.hourlyRate}/hr`;
    } else {
      const range = SALARY_RANGES.find(r => r.value === participant.salaryRange);
      return range ? range.label : "Not set";
    }
  };
  
  // Format money for display with appropriate precision
  const formatMoney = (amount: number): string => {
    // Show cents only if the amount is small or has significant cents
    if (amount < 100 || amount % 1 > 0.01) {
      return amount.toFixed(2);
    }
    return amount.toFixed(0);
  };

  // Toggle showing participant details
  const toggleParticipantDetails = () => {
    setShowParticipantDetails(!showParticipantDetails);
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-8 bg-background">
      {/* Hidden export template for high-quality image capture */}
      <div className="fixed left-[-9999px] top-0 overflow-hidden">
        <ExportTemplate
          ref={exportTemplateRef}
          participants={participants}
          totalCost={totalCost}
          duration={duration}
          timeUnit={timeUnit}
          useExactRates={useExactRates}
          getSalaryRangeMidpoint={getSalaryRangeMidpoint}
          calculateIndividualCost={calculateIndividualCost}
          calculatePersonHours={calculatePersonHours}
          formatMoney={formatMoney}
          meetingName={meetingName}
          isDarkMode={isDarkMode}
        />
      </div>
    
      <Card className="w-full max-w-4xl relative" variant="borderless">
        <div className="absolute top-3 sm:top-5 right-3 sm:right-5 z-10">
          <ThemeToggle />
        </div>
        
        <CardHeader className="pb-2 sm:pb-4 px-4 sm:px-6">
          <div className="flex flex-col items-center">
            <CardTitle className="text-center text-2xl sm:text-3xl font-bold tracking-tight">Timeloss</CardTitle>
            <CardDescription className="text-center mb-2 text-sm sm:text-base opacity-80">
              Calculate the true cost of your meetings
            </CardDescription>
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
                      <span>{useExactRates ? "Everyone earns:" : "Everyone's in range:"}</span>
                    </Label>
                  </div>
                  
                  <div className="w-full sm:flex-1 transition-all duration-200 ease-in-out">
                    {useExactRates ? (
                      <div className="flex items-center animate-in fade-in duration-200 w-full">
                        <Input
                          type="number"
                          placeholder="e.g., 50"
                          className="w-full sm:max-w-40 rounded-lg"
                          min="1"
                          step="1"
                          onChange={(e) => {
                            if (e.target.value) applyRateToAll(e.target.value);
                          }}
                        />
                        <span className="ml-2 text-sm font-medium">$/hr</span>
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
                                {range.label}
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
              </div>
              
              {/* Participant details */}
              <div className="border-t border-border/30 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Participant Details</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleParticipantDetails}
                    className="flex items-center gap-1 rounded-full text-xs px-3 sm:px-4 py-1"
                  >
                    {showParticipantDetails ? "Hide Details" : "Show Details"}
                  </Button>
                </div>
                
                {showParticipantDetails && (
                  <div className="mt-3 space-y-4">
                    {participants.map((participant, index) => (
                      <div key={participant.id} className="grid grid-cols-1 gap-3 items-start p-3 sm:p-4 rounded-xl bg-muted/5">
                        <div className="w-full">
                          <Label htmlFor={`name-${participant.id}`} className="text-sm mb-1 block">Name (Optional)</Label>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            <Input
                              id={`name-${participant.id}`}
                              value={participant.name}
                              onChange={(e) => updateParticipant(participant.id, "name", e.target.value)}
                              placeholder={`Person ${index + 1}`}
                              className="w-full rounded-lg"
                            />
                          </div>
                        </div>
                        
                        <div className="w-full transition-all duration-200 ease-in-out">
                          {useExactRates ? (
                            <div className="animate-in fade-in duration-200">
                              <Label htmlFor={`rate-${participant.id}`} className="text-sm mb-1 block">Hourly Rate (USD)</Label>
                              <Input
                                id={`rate-${participant.id}`}
                                type="number"
                                placeholder="e.g., 50"
                                value={participant.hourlyRate}
                                onChange={(e) => updateParticipant(participant.id, "hourlyRate", e.target.value)}
                                min="1"
                                step="1"
                                className="w-full rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="animate-in fade-in duration-200">
                              <Label htmlFor={`range-${participant.id}`} className="text-sm mb-1 block">Salary Range</Label>
                              <Select
                                value={participant.salaryRange}
                                onValueChange={(value) => updateParticipant(participant.id, "salaryRange", value)}
                              >
                                <SelectTrigger id={`range-${participant.id}`} className="w-full rounded-lg">
                                  <SelectValue placeholder="Select range" />
                                </SelectTrigger>
                                <SelectContent>
                                  {SALARY_RANGES.map((range) => (
                                    <SelectItem key={range.value} value={range.value}>
                                      {range.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-end w-full">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-red-500 h-9 w-9 rounded-full"
                            onClick={() => removeParticipant(participant.id)}
                            disabled={participants.length === 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                    ${totalCost !== null ? formatMoney(totalCost) : "0"}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {participants.length} {participants.length === 1 ? 'person' : 'people'} × {duration || '1'} {timeUnit}
                  </p>
                </div>
                
                <div className="text-center sm:text-right p-2 sm:p-3 rounded-xl">
                  <h3 className="font-medium text-base sm:text-lg mb-1">Per Person Average</h3>
                  <p className="text-2xl sm:text-3xl font-semibold tracking-tight">
                    ${totalCost !== null && participants.length > 0 
                      ? formatMoney(totalCost / participants.length) 
                      : "0"}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Total person-hours: {calculatePersonHours()}
                  </p>
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
                  variant="outline"
                  className="h-10 gap-1 px-4 w-full sm:w-auto"
                  onClick={() => exportAsImage('png')}
                  disabled={!!exportStatus}
                >
                  {exportStatus ? exportStatus : <>
                    <Camera className="h-4 w-4 mr-2" /> Export as Image
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
                          <span className="font-medium">{participant.name || `Person ${participants.indexOf(participant) + 1}`} ({rateDisplay})</span>
                          <span className="font-bold">${formatMoney(individualCost)}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {participants.length > 2 && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-4 p-3 rounded text-center bg-background/40">
                      That&apos;s ${formatMoney(totalCost / 60)} per minute for this group
                    </p>
                  )}
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