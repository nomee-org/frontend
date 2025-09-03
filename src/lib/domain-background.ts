function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function generateSpaceColor(domain: string): {
  primary: string;
  secondary: string;
  accent: string;
} {
  const hash = hashString(domain);

  // Generate space-themed colors (purples, blues, deep reds, cyans)
  const hues = [240, 260, 280, 300, 320, 180, 200, 340, 360, 20]; // Purple, blue, cyan, red spectrum
  const primaryHue = hues[hash % hues.length];
  const secondaryHue = (primaryHue + 30) % 360;
  const accentHue = (primaryHue + 60) % 360;

  const saturation = 60 + (hash % 40); // 60-100%
  const lightness = 25 + (hash % 25); // 25-50% for dark space feel

  return {
    primary: `hsl(${primaryHue}, ${saturation}%, ${lightness}%)`,
    secondary: `hsl(${secondaryHue}, ${saturation - 10}%, ${lightness + 10}%)`,
    accent: `hsl(${accentHue}, ${saturation + 20}%, ${lightness + 20}%)`,
  };
}

export function generateDomainBackground(domain: string): string {
  const colors = generateSpaceColor(domain);
  const hash = hashString(domain);

  // Generate unique wave patterns
  const amplitude1 = 15 + (hash % 10);
  const amplitude2 = 20 + ((hash >> 4) % 15);
  const frequency1 = 0.8 + ((hash >> 8) % 5) * 0.1;
  const frequency2 = 1.2 + ((hash >> 12) % 5) * 0.1;
  const phase = hash % 360;

  // Create wavy space background SVG
  const svg = `
    <svg width="100%" height="100%" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="bg-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${
            colors.primary
          };stop-opacity:1" />
          <stop offset="50%" style="stop-color:${
            colors.secondary
          };stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${
            colors.accent
          };stop-opacity:0.6" />
        </linearGradient>
        <filter id="stars-${hash}">
          <feTurbulence baseFrequency="0.9" numOctaves="1" result="noise" seed="${
            hash % 100
          }"/>
          <feColorMatrix in="noise" type="saturate" values="0"/>
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues="0 .5 0 0 0 0 0 0 0 .2 0 0 0 0 0 .1 0 0 .1 0"/>
          </feComponentTransfer>
          <feColorMatrix type="matrix" values="1 1 1 0 0 1 1 1 0 0 1 1 1 0 0 0 0 0 1 0"/>
        </filter>
      </defs>
      
      <!-- Base gradient background -->
      <rect width="100%" height="100%" fill="url(#bg-${hash})"/>
      
      <!-- Stars -->
      <rect width="100%" height="100%" filter="url(#stars-${hash})" opacity="0.6"/>
      
      <!-- Wavy layers -->
      <path d="M0,${150 + amplitude1 * Math.sin((phase * Math.PI) / 180)} 
               Q${100 * frequency1},${
    120 + amplitude1 * Math.sin(((phase + 90) * Math.PI) / 180)
  } 
               ${200 * frequency1},${
    150 + amplitude1 * Math.sin(((phase + 180) * Math.PI) / 180)
  }
               T400,${
                 130 + amplitude1 * Math.sin(((phase + 270) * Math.PI) / 180)
               } 
               L400,300 L0,300 Z" 
            fill="${colors.secondary}" 
            opacity="0.3"/>
      
      <path d="M0,${
        180 + amplitude2 * Math.sin(((phase + 45) * Math.PI) / 180)
      } 
               Q${120 * frequency2},${
    160 + amplitude2 * Math.sin(((phase + 135) * Math.PI) / 180)
  } 
               ${240 * frequency2},${
    180 + amplitude2 * Math.sin(((phase + 225) * Math.PI) / 180)
  }
               T400,${
                 200 + amplitude2 * Math.sin(((phase + 315) * Math.PI) / 180)
               } 
               L400,300 L0,300 Z" 
            fill="${colors.accent}" 
            opacity="0.2"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function getDomainBackgroundStyle(domain: string): React.CSSProperties {
  return {
    backgroundImage: `url("${generateDomainBackground(domain)}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
}
