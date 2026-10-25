import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/incidents", async (req, res) => {
    try {
      const response = await fetch("http://pipager.dyndns.org:211/pager/DME.txt");
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      let text = await response.text();
      text = text.replace(/<EOT>/g, '').replace(/<EO/g, '');
      
      const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
      
      const incidents = lines.map((line, index) => {
        // Regex to parse: "FFW Reinsdorf(1930057) 02:49:56 2026-07-18 THKl Dobien Mochauer Weg THL: Wasserschaden Keller"
        const regex = /^(.*?)\((\d+)\)\s+(\d{2}:\d{2}:\d{2})\s+(\d{4}-\d{2}-\d{2})\s+(.*?)$/;
        const match = line.match(regex);
        
        if (match) {
          let [_, unit, id, time, date, message] = match;
          
          unit = unit.replace(/^[#\s\d:-]+/, '').trim();
          
          let category = "INFO";
          let color = "gray";
          let type = "HINWEIS";
          
          const lowerMsg = message.toLowerCase();
          if (lowerMsg.includes('bma') || lowerMsg.includes('objk') || lowerMsg.includes('brand') || lowerMsg.match(/\b[bf]\d\b/)) {
            category = "BRANDEINSATZ";
            color = "red";
            type = "BRANDEINSATZ";
          } else if (lowerMsg.includes('baum') || lowerMsg.includes('ast')) {
            category = "TECHNISCHE HILFE";
            color = "green";
            type = "TECHNISCHE HILFE";
          } else if (lowerMsg.includes('thl') || lowerMsg.includes('thkl') || lowerMsg.includes('wasser')) {
            category = "TECHNISCHE HILFE";
            color = "orange";
            type = "TECHNISCHE HILFE";
          } else if (lowerMsg.includes('rettung') || lowerMsg.includes('notfall') || lowerMsg.includes('first responder')) {
            category = "HILFELEISTUNG";
            color = "blue";
            type = "HILFELEISTUNG";
          }
          
          let parsedTitle = message;
          let parsedLocation = unit.trim();
          
          const tokens = message.split(' ');
          if (tokens.length >= 2) {
              const parsedKeyword = tokens[0];
              const parsedCity = tokens[1];
              
              let streetTokens = [];
              let descTokens = [];
              let foundDescStart = false;
              
              for (let i = 2; i < tokens.length; i++) {
                  const t = tokens[i];
                  const cleanT = t.replace(/:/g, '');
                  const descKeywords = ['RD', 'THL', 'VU', 'BMA', 'KOMBIEINSATZ', 'BRAND', 'HILFELEISTUNG'];
                  const isDescKeyword = descKeywords.includes(cleanT) || t.endsWith(':');
                  
                  if (!foundDescStart && isDescKeyword) {
                      foundDescStart = true;
                  }
                  
                  if (foundDescStart) {
                      descTokens.push(t);
                  } else {
                      streetTokens.push(t);
                  }
              }
              
              const parsedStreet = streetTokens.join(' ');
              let parsedDesc = descTokens.join(' ');
              
              parsedLocation = parsedStreet ? `${parsedCity} ${parsedStreet}` : parsedCity;
              
              if (parsedDesc.endsWith(':')) {
                  parsedDesc = parsedDesc.substring(0, parsedDesc.length - 1).trim();
              }
              
              if (parsedDesc) {
                  // clean up if desc starts with something redundant like "THL: Wasserschaden" and we want a clean title
                  // Actually the user wants it to be easy to read, let's keep it as is, maybe remove trailing/leading colons
                  parsedDesc = parsedDesc.replace(/^:\s*/, '');
                  parsedTitle = `${parsedKeyword} - ${parsedDesc}`;
              } else {
                  parsedTitle = `${parsedKeyword} - ${parsedStreet}`; // fallback if no desc found
                  // If we didn't find a desc, it means the whole rest was assumed to be street.
                  // Maybe the whole thing is just "Keyword Description"
                  if (streetTokens.length > 2) {
                     // likely not a street, let's just use the original message
                     parsedTitle = message;
                  }
              }
          }
          
          return {
            id: `${id}-${index}`,
            unit: unit.trim(),
            time: time.slice(0, 5), // "02:49"
            date,
            message: message.trim(),
            category,
            color,
            type,
            title: parsedTitle,
            location: parsedLocation,
            status: "EINGESETZT"
          };
        }
        
        // Fallback for lines that don't match the regex perfectly
        return {
          id: `unknown-${index}`,
          unit: "System",
          time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().split('T')[0],
          message: line,
          category: "INFO",
          color: "gray",
          type: "HINWEIS",
          status: ""
        };
      });

      // Filter out empty system messages or purely garbage messages (like "########00:21:59 2026-07-18 #######")
      const validIncidents = incidents.filter(i => !i.message.startsWith('########'));

      // Group incidents by message and time (within 60 minutes) to consolidate units
      const groupedIncidents: any[] = [];
      for (const incident of validIncidents) {
        if (incident.category === "INFO" && incident.unit === "System") {
           groupedIncidents.push(incident);
           continue;
        }
        
        const [h, m] = incident.time.split(':').map(Number);
        const timeInMins = h * 60 + m;
        
        const existing = groupedIncidents.find(g => {
           if (g.date !== incident.date) return false;
           if (g.message !== incident.message) return false;
           const [gh, gm] = g.time.split(':').map(Number);
           const gTimeInMins = gh * 60 + gm;
           return Math.abs(gTimeInMins - timeInMins) <= 60; // within 60 minutes
        });
        
        if (existing) {
           if (!existing.units) existing.units = [existing.unit];
           if (!existing.units.includes(incident.unit)) {
               existing.units.push(incident.unit);
           }
        } else {
           incident.units = [incident.unit];
           groupedIncidents.push(incident);
        }
      }

      res.json(groupedIncidents.reverse()); // Show newest first
    } catch (error) {
      console.error("Error fetching DME:", error);
      res.status(500).json({ error: "Failed to fetch incidents" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
