# Programming Paradigm Practice - Asteroids
An implementation of the classic Asteroids game in proper functional reactive programming style. Includes usage of observable streams.

### Design Principles

I have used const for all the variables to maintain the purity and transparency of all functions.  
This ensures that once a variable is bounded to a value, it cannot be reassigned.This eliminates the risk of causing unwanted side effects.

My approach to this game is similar to how a normal JavaScript /HTML game will be coded.
The overall framework can be divided into *two* parts,

1. The Draw Observable, the main observable.
This observable is triggered once per FREQ ms.The main observable of the game updates the game 
screen by calculating the the new coordinates of each and every element and move them when it is triggered.
Furthermore,the main observable Draw also 
a)calculates the acceleration speed of the ship 
b)checks if there collision between asteroids & bullets
c)checks if there collision between asteroid & the ship. 
d)checks whether a new asteroid can be spawn and so on

2. The second part are the keyboard events. The keyboard events are relatively simpler than Draw.
The main task of this observable is to track whether a key is pressed. However, there's a problem here.
How does the two main components communicate with each other?
ie: how does the Draw observable know if a key is pressed or not.
In order to solve this, I used attr. 
Which means , when a W key is pressed, i set the 'data-up' value to true. Thus the key press will be seen 
when the next frame is being rendered. The other controls are done in a similar manner. Most of the attributes start 
with 'data-' are used to establish a communication between the two observables.


Other Explanations
The game restarts when there's a collision between the asteroid and the ship.  
This is done by 
1. making all the other elements 'invisible'
2. marking their 'data-ready' attribute as False, this simply means that the element is not ready yet.  

Furthermore,the bullets and asteroids are stored in a array of fixed length.
Having too many asteroids / too many bullets can make the game too hard/ too easy to play.
Therefore, there is a maximum number of bullets & asteroids that can be created.

