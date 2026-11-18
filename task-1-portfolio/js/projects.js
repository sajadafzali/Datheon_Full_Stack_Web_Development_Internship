/**
 * Project data — edit this file to add or change projects.
 * The cards on the page and the popup modal are both generated from it.
 *
 * TODO: replace the "#" repo links with your real GitHub URLs
 * (or delete a link object to hide that button).
 */
window.PROJECTS = [
  {
    id: "face-detection",
    title: "Intelligent Face Detection & Analysis System",
    summary: "A team project that detects faces in images and analyses the emotion on each one.",
    description:
      "A university team project that combines object detection and deep learning. The system finds faces with YOLOv8, classifies the emotion on each face with a custom-trained CNN (EmotionCNN), and presents the results in an interactive Streamlit web app.",
    features: [
      "Face detection with YOLOv8 and bounding boxes",
      "Emotion classification with a custom EmotionCNN model",
      "Model evaluation with a confusion matrix and bounding-box distribution charts",
      "Interactive Streamlit interface for uploading images and viewing results",
    ],
    stack: ["Python", "YOLOv8", "CNN", "Streamlit"],
    theme: "violet",
    icon: "🧠",
    links: [{ label: "Source code", href: "https://github.com/Sajad-Afzali/face-detection-system" }],
  },
  {
    id: "weather-app",
    title: "AI Weather App",
    summary: "A desktop weather app with live forecasts, machine-learning features and voice search.",
    description:
      "A university team project: a desktop application that shows live weather data from the OpenWeatherMap API, adds machine-learning features with scikit-learn, stores data in a MySQL database and lets you search by voice.",
    features: [
      "Live weather data from the OpenWeatherMap API",
      "Machine-learning features built with scikit-learn",
      "Data stored in a MySQL database",
      "Voice search for hands-free city lookup",
      "Desktop GUI built with PyQt5",
    ],
    stack: ["Python", "PyQt5", "OpenWeatherMap API", "scikit-learn", "MySQL"],
    theme: "blue",
    icon: "⛅",
    links: [{ label: "Source code", href: "https://github.com/Sajad-Afzali/ai-weather-app" }],
  },
  {
    id: "shopwave",
    title: "Shopwave E-Commerce Storefront",
    summary: "A responsive online store with live product data, filtering and a persistent shopping cart.",
    description:
      "A framework-free storefront built during the Datheon internship. It fetches products from FakeStoreAPI, lets shoppers filter, search and sort, and includes a slide-out cart with tax and shipping calculation plus a simulated checkout.",
    features: [
      "Products loaded from FakeStoreAPI with offline fallback",
      "Category filters, search and sorting",
      "Slide-out cart with quantity controls, tax and free-shipping rule",
      "Cart saved in localStorage; simulated checkout with validation",
      "Unit-tested cart logic",
    ],
    stack: ["JavaScript (ES6+)", "HTML5", "CSS Grid", "FakeStoreAPI"],
    theme: "amber",
    icon: "🛍️",
    links: [{ label: "Source code", href: "https://github.com/Sajad-Afzali/Datheon_Full_Stack_Web_Development_Internship/tree/main/task-4-ecommerce-store" }],
  },
 ];