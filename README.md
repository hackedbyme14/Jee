# JEE Exam Tracker

A customizable countdown application for tracking important events like the JEE Exam. Set your target date, track progress, and get reminders, all with a clean, study-focused interface.

## Features

*   **Live Countdown**: Displays remaining time in `DD : HH : MM : SS` format, updating every second.
*   **Toggle Seconds**: Option to show or hide seconds in the countdown display.
*   **Human-Friendly Time**: "X days, Y hours, Z minutes remaining" message for easy understanding.
*   **Daily Motivational Quotes**: Displays a new inspiring quote daily, relevant to studying and perseverance, to keep you motivated.
*   **Progress Bar**: Visualizes the elapsed time between an optional start date (defaults to now) and the target date.
*   **Configurable Settings**:
    *   Set Target Date/Time (default: January 21, 2026 00:00:00 IST).
    *   Set an Optional Start Date/Time for progress tracking.
    *   Customize the Title/Label for your countdown.
    *   **Accent Color Schemes**: Choose from various accent color palettes (e.g., Blue Ocean, Green Forest, Purple Haze, Red Ember) to personalize the dark theme.
*   **Persistence**: All settings (title, target date, start date, toggles, color scheme) are saved to `localStorage` and automatically loaded on revisit.
*   **Browser Notifications**: Configure reminders (e.g., 30 days, 7 days, 1 day, 1 hour before). Fallback to in-app alerts if notification permission is denied or unavailable.
*   **Share Functionality**: Generate and copy a deep link to your clipboard, pre-configured with your current title, target date, and color scheme, making it easy to share your countdown.
*   **Accessibility**: Implements `aria-live` for countdown updates, keyboard focus, and proper input labels.
*   **Accuracy**: Countdown remains accurate even if system timezone changes, as dates are stored as UTC.
*   **Past Target Handling**: Clearly indicates "Exam passed" and shows time elapsed since the target.
*   **Input Validation**: Provides inline validation messages for invalid date inputs.
*   **Minimal Dependencies**: Built using only React, TypeScript, and native browser APIs (Date, Intl).

## Getting Started

This project is a React single-page application built with TypeScript and styled using Tailwind CSS (via CDN).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd jee-exam-tracker
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Application

To run the application in development mode:

```bash
npm start
# or
yarn start
```

This will usually open the application in your browser at `http://localhost:3000`. The app will automatically reload if you make changes.

### Testing

This project includes unit tests for the date utility functions using Jest and React Testing Library.

To run the tests:

```bash
npm test
# or
yarn test
```

### Deployment

This application is a static single-page application and can be easily deployed to various static hosting services (e.g., Netlify, Vercel, GitHub Pages, Firebase Hosting).

1.  **Build the application for production:**
    ```bash
    npm run build
    # or
    yarn build
    ```
    This command creates a `build` directory with optimized static files.

2.  **Deploy the `build` directory:**
    Upload the contents of the `build` directory to your preferred static hosting provider.

    **Example (for Netlify):**
    *   Connect your GitHub repository.
    *   Set the build command to `npm run build` (or `yarn build`).
    *   Set the publish directory to `build`.

## Usage

1.  **Customize Title**: Edit the "Title / Label" input field to name your countdown.
2.  **Set Target Date & Time**: Use the "Target Date & Time" input to set your exam date. This is fixed to `Asia/Kolkata` (IST).
3.  **Set Start Date (Optional)**: If you want to track progress, set a "Start Date & Time". If left blank, the progress bar will not display.
4.  **Show Seconds**: Toggle the "Show Seconds" switch to include or exclude seconds from the main countdown display.
5.  **Accent Color Scheme**: Select your preferred color scheme from the dropdown in the settings panel to customize the app's accent colors.
6.  **Enable Notifications**: Turn on "Enable Notifications" and grant permission if prompted by your browser. Then select desired reminder intervals (e.g., 30 days, 7 days, 1 day, 1 hour before).
7.  **Share**: Click "Share Configuration" to copy a deep link that will load your current settings (including title, target date, and color scheme) when shared with others.

## Accessibility

The application is designed with accessibility in mind:

*   **`aria-live="polite"`**: The main countdown display uses `aria-live` to announce updates to screen readers.
*   **Keyboard Navigation**: All interactive elements are reachable and operable via keyboard.
*   **Labels**: All input fields have associated labels for clarity.
*   **Color Contrast**: Uses a color palette with sufficient contrast for readability in both light and dark themes.

## Technical Details

*   **React 18+**: For modern React features and performance.
*   **TypeScript**: For type safety and better developer experience.
*   **Tailwind CSS**: For utility-first styling and responsive design.
*   **`Date` and `Intl` APIs**: Used for all date and time calculations, formatting, and timezone handling without external libraries.
*   **`localStorage`**: For client-side persistence of user settings.
*   **Framer Motion**: For smooth UI animations.

## Contributing

Feel free to open issues or submit pull requests.

## License

This project is open source and available under the [MIT License](LICENSE).