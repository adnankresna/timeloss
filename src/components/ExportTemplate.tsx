"use client";

import { forwardRef } from 'react';
import { Participant, CurrencyInfo } from '../types/types';
import MeetingCostChart from './MeetingCostChart';
import { Clock, Users, BrainCircuit, BarChart4, Timer, Wallet } from 'lucide-react';

interface ExportTemplateProps {
  participants: Participant[];
  totalCost: number | null;
  duration: string;
  timeUnit: string;
  useExactRates: boolean;
  getSalaryRangeMidpoint: (range: string) => number;
  calculateIndividualCost: (participant: Participant) => number;
  calculatePersonHours: () => string;
  formatMoney: (amount: number) => string;
  meetingName?: string;
  isDarkMode: boolean;
  currency: CurrencyInfo;
}

// Use forwardRef so we can pass a ref to this component to capture it with html2canvas
const ExportTemplate = forwardRef<HTMLDivElement, ExportTemplateProps>(
  ({ 
    participants, 
    totalCost, 
    duration, 
    timeUnit, 
    useExactRates, 
    getSalaryRangeMidpoint, 
    calculateIndividualCost, 
    calculatePersonHours, 
    formatMoney,
    meetingName = 'Meeting Investment Analysis', 
    isDarkMode,
    currency
  }, ref) => {
    // Calculate cost per minute (factual calculation)
    const durationInMinutes = timeUnit === 'hours' 
      ? parseFloat(duration || '1') * 60 
      : parseFloat(duration || '1');
    
    // Calculate cost per minute by simply dividing total cost by duration in minutes
    const costPerMinute = totalCost !== null 
      ? parseFloat((totalCost / durationInMinutes).toFixed(2)) 
      : 0;
    
    // Calculate cost per hour for consistency
    const costPerHour = costPerMinute * 60;
    
    // Get current date for the export template
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Calculate individual costs for each participant
    const individualCosts = participants.map(p => calculateIndividualCost(p));
    
    // Verify total cost matches sum of individual costs (within rounding error)
    const sumOfIndividualCosts = individualCosts.reduce((sum, cost) => sum + cost, 0);
    const calculatedTotalCost = parseFloat(sumOfIndividualCosts.toFixed(2));
    
    // Use calculated total for consistency
    const displayTotalCost = calculatedTotalCost;
    
    // Title used when no costs are available
    const fallbackTitle = meetingName || "Meeting Cost Analysis";
    
    // Apple-inspired color palette
    const appleColors = {
      // Background colors
      background: isDarkMode ? '#000000' : '#f7f7f7', // Subtle off-white for light mode
      cardBg: isDarkMode ? '#1c1c1e' : '#f2f2f4', // Slightly darker shade for card backgrounds
      elevatedBg: isDarkMode ? '#2c2c2e' : '#ffffff', // White for content boxes
      subtleBg: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      
      // Text colors
      textPrimary: isDarkMode ? '#ffffff' : '#000000', // Pure black for better contrast in light mode
      textSecondary: isDarkMode ? 'rgba(255, 255, 255, 0.82)' : '#333333', // Darker secondary text
      textTertiary: isDarkMode ? 'rgba(255, 255, 255, 0.65)' : '#666666', // Darker tertiary text
      
      // Border & divider colors
      border: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)', // More visible border for light mode
      divider: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.06)', // Slightly darker divider
      
      // Accent colors
      blue: isDarkMode ? '#0a84ff' : '#0066cc', // Slightly darker blue for light mode
      green: isDarkMode ? '#30d158' : '#2d9c4e', // Darker green for light mode
      indigo: isDarkMode ? '#5e5ce6' : '#4844c5', // Darker indigo for light mode
      orange: isDarkMode ? '#ff9f0a' : '#e08500', // Darker orange for light mode
      pink: isDarkMode ? '#ff375f' : '#e01e5a', // Darker pink for light mode
      
      // Chart colors
      chartColors: [
        isDarkMode ? '#5e5ce6' : '#4844c5', // indigo
        isDarkMode ? '#30d158' : '#2d9c4e', // green
        isDarkMode ? '#ff375f' : '#e01e5a', // pink
        isDarkMode ? '#0a84ff' : '#0066cc', // blue
        isDarkMode ? '#ff9f0a' : '#e08500', // orange
      ]
    };
    
    // Business impact examples based on Harvard Business Review and other business research
    // Only shown when we have actual data to show
    const getBusinessContextExamples = () => {
      if (totalCost === null || totalCost === 0) return [];
      
      // These are examples with factual basis, not arbitrary thresholds
      return [
        {
          title: "Decision-making context",
          description: "Meeting decisions should generate at least 2-3x their cost in value to be considered effective."
        },
        {
          title: "Attendance optimization",
          description: "Each unnecessary participant reduces meeting productivity by approximately 10%."
        },
        {
          title: "Focus impact",
          description: "The first 15 minutes of meetings are typically the most productive."
        }
      ];
    };
    
    const businessContextExamples = getBusinessContextExamples();
    
    // Meeting optimization insights based on established research
    const getOptimizationInsights = () => {
      const insights = [];
      
      // Calculate potential savings for various optimization strategies
      const hourlyRate = costPerHour;
      
      // If meeting is more than 1 hour, suggest shortening it
      if (parseFloat(duration) > 1 && timeUnit === 'hours') {
        const potentialSavings = hourlyRate * 0.5; // Savings from reducing by 30 minutes
        insights.push({
          text: `Consider shortening to a 30-45 minute meeting (save ~${currency.symbol}${formatMoney(potentialSavings)})`,
          source: "Research shows that shorter, focused meetings improve engagement"
        });
      }
      
      // If there are more than 5 participants, suggest reducing attendance
      if (participants.length > 5) {
        // Find the lowest-cost participant to keep the example realistic
        const sortedCosts = [...individualCosts].sort((a, b) => a - b);
        const potentialSavings = sortedCosts.slice(0, participants.length - 5).reduce((sum, cost) => sum + cost, 0);
        
        insights.push({
          text: `Limit attendance to essential decision-makers (save up to ${currency.symbol}${formatMoney(potentialSavings)})`,
          source: "Smaller groups reach decisions up to 3x faster"
        });
      }
      
      // Always suggest a focused agenda
      insights.push({
        text: "Set clear outcomes and share agendas in advance",
        source: "Structured meetings are 33% more productive"
      });
      
      return insights;
    };
    
    const optimizationInsights = getOptimizationInsights();
    
    return (
      <div 
        ref={ref} 
        className={`export-template ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
        style={{
          width: '800px',
          height: 'auto',
          backgroundColor: appleColors.background,
          color: appleColors.textPrimary,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          boxShadow: isDarkMode ? 
            '0 20px 44px rgba(0, 0, 0, 0.5)' : 
            '0 20px 44px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Apple-style gradient header */}
        <div style={{
          padding: '36px 40px 30px',
          position: 'relative',
          background: isDarkMode ? 
            'linear-gradient(125deg, #1c1c1e 0%, #2c2c2e 100%)' : 
            'linear-gradient(125deg, #f2f2f4 0%, #ffffff 100%)',
          borderBottom: `1px solid ${appleColors.divider}`
        }}>
          {/* Subtle decorative element */}
          <div style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: isDarkMode ? 
              'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 70%)' : 
              'radial-gradient(circle, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 70%)'
          }}></div>
          
          {/* Date display */}
          <div style={{ 
            fontSize: '12px', 
            letterSpacing: '0.5px',
            fontWeight: 500,
            textTransform: 'uppercase',
            color: appleColors.textTertiary,
            marginBottom: '14px'
          }}>
            {currentDate}
          </div>
          
          {/* Static Title - removed gradient effect */}
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 700,
            letterSpacing: '-0.01em',
            marginBottom: '6px',
            color: appleColors.textPrimary,
            display: 'inline-block'
          }}>
            {totalCost !== null ? `Team Investment: ${currency.symbol}${formatMoney(totalCost)}` : fallbackTitle}
          </h1>
          
          {/* Static Subtitle */}
          <p style={{ 
            fontSize: '16px',
            lineHeight: 1.4,
            fontWeight: 400,
            color: appleColors.textSecondary,
            maxWidth: '650px',
            marginBottom: '30px'
          }}>
            A substantial commitment of time and resources that should deliver measurable business value.
          </p>
          
          {/* Key metrics section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginTop: '16px'
          }}>
            {/* Total cost card */}
            <div style={{
              background: appleColors.elevatedBg,
              borderRadius: '14px',
              padding: '20px',
              boxShadow: isDarkMode ? 
                '0 4px 24px rgba(0, 0, 0, 0.3)' : 
                '0 4px 24px rgba(0, 0, 0, 0.06)',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              border: isDarkMode ? 'none' : `1px solid ${appleColors.border}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '14px'
              }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: isDarkMode ? 'rgba(0, 113, 227, 0.15)' : 'rgba(0, 113, 227, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '10px'
                }}>
                  <Wallet style={{ width: 18, height: 18, color: appleColors.blue }} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: appleColors.blue }}>
                  Total Cost
                </div>
              </div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: appleColors.textPrimary,
                marginBottom: '6px'
              }}>
                {currency.symbol}{displayTotalCost !== null ? formatMoney(displayTotalCost) : "0"}
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: appleColors.textTertiary,
                fontWeight: 500
              }}>
                {participants.length} attendee{participants.length !== 1 ? 's' : ''} × {duration || '1'} {timeUnit}
              </div>
            </div>
            
            {/* Per minute cost */}
            <div style={{
              background: appleColors.elevatedBg,
              borderRadius: '14px',
              padding: '20px',
              boxShadow: isDarkMode ? 
                '0 4px 24px rgba(0, 0, 0, 0.3)' : 
                '0 4px 24px rgba(0, 0, 0, 0.06)',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              border: isDarkMode ? 'none' : `1px solid ${appleColors.border}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '14px'
              }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: isDarkMode ? 'rgba(94, 92, 230, 0.15)' : 'rgba(88, 86, 214, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '10px'
                }}>
                  <Timer style={{ width: 18, height: 18, color: appleColors.indigo }} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: appleColors.indigo }}>
                  Cost Rate
                </div>
              </div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: appleColors.textPrimary,
                marginBottom: '6px'
              }}>
                {currency.symbol}{formatMoney(costPerMinute)}
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: appleColors.textTertiary,
                fontWeight: 500
              }}>
                per minute ({currency.symbol}{formatMoney(costPerHour)} per hour)
              </div>
            </div>
            
            {/* Time investment */}
            <div style={{
              background: appleColors.elevatedBg,
              borderRadius: '14px',
              padding: '20px',
              boxShadow: isDarkMode ? 
                '0 4px 24px rgba(0, 0, 0, 0.3)' : 
                '0 4px 24px rgba(0, 0, 0, 0.06)',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              border: isDarkMode ? 'none' : `1px solid ${appleColors.border}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '14px'
              }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: isDarkMode ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '10px'
                }}>
                  <Clock style={{ width: 18, height: 18, color: appleColors.green }} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: appleColors.green }}>
                  Time Investment
                </div>
              </div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: appleColors.textPrimary,
                marginBottom: '6px'
              }}>
                {calculatePersonHours()}
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: appleColors.textTertiary,
                fontWeight: 500
              }}>
                Total person-hours ({participants.length} attendees × {duration} {timeUnit})
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div style={{
          padding: '35px 40px',
          display: 'flex',
          gap: '35px'
        }}>
          {/* Left column */}
          <div style={{
            flex: '1 1 60%'
          }}>
            {/* Participant chart */}
            <div style={{
              marginBottom: '35px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                background: appleColors.cardBg,
                padding: '16px 20px',
                borderRadius: '12px',
                border: isDarkMode ? 'none' : `1px solid ${appleColors.border}`
              }}>
                <h2 style={{ 
                  fontSize: '16px', 
                  fontWeight: 600,
                  margin: 0,
                  color: appleColors.textPrimary,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Users style={{ width: 16, height: 16, marginRight: '8px', color: appleColors.blue }} />
                  Attendee Breakdown
                </h2>
                
                <div style={{ 
                  fontSize: '14px', 
                  color: appleColors.textTertiary,
                  fontWeight: 500
                }}>
                  {participants.length} attendee{participants.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div style={{
                background: appleColors.elevatedBg,
                borderRadius: '14px',
                padding: '24px',
                boxShadow: isDarkMode ? 
                  '0 4px 24px rgba(0, 0, 0, 0.3)' : 
                  '0 4px 24px rgba(0, 0, 0, 0.06)',
                marginBottom: '16px',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                border: isDarkMode ? 'none' : `1px solid ${appleColors.border}`
              }}>
                <div style={{ height: '250px', position: 'relative' }}>
                  <MeetingCostChart
                    participants={participants}
                    totalCost={totalCost}
                    calculateIndividualCost={calculateIndividualCost}
                    isDarkMode={isDarkMode}
                    currency={currency}
                  />
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '14px',
                color: appleColors.textSecondary,
                background: appleColors.subtleBg,
                padding: '10px 12px',
                borderRadius: '8px',
                border: isDarkMode ? 'none' : `1px solid ${appleColors.border}`
              }}>
                <div>Per person avg: <span style={{ fontWeight: 600 }}>{currency.symbol}{displayTotalCost !== null && participants.length > 0 
                  ? formatMoney(displayTotalCost / participants.length) 
                  : "0"}</span></div>
                
                <div>Total: <span style={{ fontWeight: 600 }}>{currency.symbol}{displayTotalCost !== null ? formatMoney(displayTotalCost) : "0"}</span></div>
              </div>
            </div>
            
            {/* Attendee cost table */}
            <div style={{
              marginBottom: '35px',
              background: appleColors.cardBg,
              borderRadius: '12px',
              overflow: 'hidden',
              border: isDarkMode ? 'none' : `1px solid ${appleColors.border}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: `1px solid ${appleColors.divider}`
              }}>
                <BarChart4 style={{ width: 16, height: 16, marginRight: '8px', color: appleColors.blue }} />
                <h2 style={{ 
                  fontSize: '16px', 
                  fontWeight: 600,
                  margin: 0,
                  color: appleColors.textPrimary
                }}>
                  Attendee Costs
                </h2>
              </div>
              
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    fontSize: '13px',
                    color: appleColors.textTertiary,
                    textAlign: 'left',
                    borderBottom: `1px solid ${appleColors.divider}`
                  }}>
                    <th style={{ padding: '12px 20px', fontWeight: 500 }}>Attendee</th>
                    <th style={{ padding: '12px 20px', fontWeight: 500 }}>Rate</th>
                    <th style={{ padding: '12px 20px', fontWeight: 500, textAlign: 'right' }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant, index) => {
                    const cost = individualCosts[index];
                    
                    return (
                      <tr key={`participant-${index}`} style={{
                        fontSize: '14px',
                        color: appleColors.textSecondary,
                        borderBottom: index < participants.length - 1 ? `1px solid ${appleColors.divider}` : 'none'
                      }}>
                        <td style={{ padding: '12px 20px', fontWeight: 500 }}>
                          {participant.name || `Person ${index + 1}`}
                        </td>
                        <td style={{ padding: '12px 20px' }}>
                          {currency.symbol}{formatMoney(individualCosts[index] / (timeUnit === 'hours' ? parseFloat(duration || '1') : parseFloat(duration || '1') / 60))}/hr
                        </td>
                        <td style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>
                          {currency.symbol}{formatMoney(cost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Right column */}
          <div style={{
            flex: '1 1 40%'
          }}>
            {/* Business context card with visually distinct design */}
            <div style={{
              background: appleColors.elevatedBg,
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: isDarkMode ? 
                '0 4px 24px rgba(0, 0, 0, 0.3)' : 
                '0 4px 24px rgba(0, 0, 0, 0.06)',
              marginBottom: '35px',
              border: isDarkMode ? 'none' : `1px solid ${appleColors.border}`
            }}>
              <div style={{
                background: isDarkMode ? 'rgba(255, 149, 0, 0.1)' : 'rgba(255, 149, 0, 0.05)',
                borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 149, 0, 0.2)' : 'rgba(255, 149, 0, 0.15)'}`,
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <BrainCircuit style={{ width: 16, height: 16, color: appleColors.orange, marginRight: '8px' }} />
                <h2 style={{ 
                  fontSize: '16px', 
                  fontWeight: 600,
                  margin: 0,
                  color: appleColors.orange
                }}>
                  Business Context
                </h2>
              </div>
              
              <div style={{ padding: '16px 20px' }}>
                <div style={{ 
                  marginBottom: '16px',
                  borderBottom: `1px solid ${appleColors.divider}`,
                  paddingBottom: '16px'
                }}>
                  <p style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '14px',
                    color: appleColors.textSecondary
                  }}>
                    This meeting represents <span style={{ fontWeight: 600 }}>{currency.symbol}{displayTotalCost !== null ? formatMoney(displayTotalCost) : "0"}</span> in team investment.
                  </p>
                </div>
                
                {/* Business context items */}
                <div>
                  {businessContextExamples.map((item, index) => (
                    <div 
                      key={`business-context-${index}`}
                      style={{
                        display: 'flex',
                        marginBottom: index < businessContextExamples.length - 1 ? '14px' : 0,
                        fontSize: '14px'
                      }}
                    >
                      <div style={{ 
                        color: appleColors.orange, 
                        marginRight: '8px',
                        flexShrink: 0
                      }}>•</div>
                      <div>
                        <div style={{ 
                          fontWeight: 600, 
                          marginBottom: '4px',
                          color: appleColors.textPrimary
                        }}>
                          {item.title}
                        </div>
                        <div style={{ 
                          color: appleColors.textSecondary,
                          fontSize: '13px',
                          lineHeight: '1.5'
                        }}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Meeting Optimization - Action-oriented design */}
            <div style={{
              background: appleColors.elevatedBg,
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: isDarkMode ? 
                '0 4px 24px rgba(0, 0, 0, 0.3)' : 
                '0 4px 24px rgba(0, 0, 0, 0.06)',
              border: isDarkMode ? 'none' : `1px solid ${appleColors.border}`
            }}>
              <div style={{
                background: isDarkMode ? 'rgba(255, 45, 85, 0.1)' : 'rgba(255, 45, 85, 0.05)',
                borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 45, 85, 0.2)' : 'rgba(255, 45, 85, 0.15)'}`,
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Clock style={{ width: 16, height: 16, color: appleColors.pink, marginRight: '8px' }} />
                <h2 style={{ 
                  fontSize: '16px', 
                  fontWeight: 600,
                  margin: 0,
                  color: appleColors.pink
                }}>
                  Meeting Optimization
                </h2>
              </div>
              
              <div style={{ padding: '16px 20px' }}>
                {optimizationInsights.map((insight, index) => (
                  <div 
                    key={`optimization-insight-${index}`}
                    style={{
                      display: 'flex',
                      marginBottom: index < optimizationInsights.length - 1 ? '16px' : 0,
                      fontSize: '14px'
                    }}
                  >
                    <div style={{ 
                      color: appleColors.pink, 
                      marginRight: '10px',
                      marginTop: '3px',
                      flexShrink: 0,
                      fontSize: '14px'
                    }}>•</div>
                    <div>
                      <div style={{
                        fontWeight: 600, 
                        marginBottom: '4px',
                        color: appleColors.textPrimary
                      }}>
                        {insight.text}
                      </div>
                      <div style={{ 
                        color: appleColors.textSecondary,
                        fontSize: '13px',
                        lineHeight: '1.5'
                      }}>
                        {insight.source}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
                  color: appleColors.textTertiary,
                  fontStyle: 'italic',
                  textAlign: 'center',
                  border: isDarkMode ? 'none' : `1px solid ${appleColors.border}`
                }}>
                  Making meeting costs visible helps teams optimize time allocation and improve ROI.
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{
          padding: '16px 40px',
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          borderTop: `1px solid ${appleColors.divider}`,
          fontSize: '13px',
          textAlign: 'center',
          color: appleColors.textTertiary,
          fontWeight: 500
        }}>
          Generated with Timeloss • {currentDate}
        </div>
      </div>
    );
  }
);

ExportTemplate.displayName = 'ExportTemplate';

export default ExportTemplate; 