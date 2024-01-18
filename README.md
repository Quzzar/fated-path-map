### Fated Path - Map Generator

**Project Overview:** 
This map generator is a website that generated 3D maps based on parameters from injected JavaScript. Developed as a part of Fated Path, a text-based game I'm working on created in React Native, this tool addresses the challenge of world generation within the single-threaded limitations of JavaScript. 

**Core Functionality:**
- **World Generation:** Automatically generates a 3D world based on input JavaScript data. This includes various territories, kingdoms, cities, and biomes like forests.
- **Isometric View:** Renders the 3D world in an isometric perspective, offering a comprehensive view of the generated world.
- **Player Input:** Will seemlessly update based on events passed between it and the React Native app it runs inside of.

**Technical Solution:**
- **Single-Thread Limitation:** JavaScript’s single-thread nature posed a challenge for complex world generation tasks.
- **Browser-Based Multithreading:** To circumvent this, the map generator is a basic website. This website is then displayed within an internal browser in the React Native app.
- **Advantages:** This approach leverages the phone’s multithreading capabilities, allowing for seamless world generation without freezing the main app. It effectively separates the heavy-duty map rendering task from the main game thread.

**Development Progress:** 
Fated Path is currently a work-in-progress, with ongoing refinements to its world generation algorithms and integration with the main game app.

**Future Enhancements:**
- Enhancing the detail and variety in the generated worlds.
- Improving integration with the React Native app for a smoother user experience.
- Potentially adding user customization options for world generation parameters.
