# Tesi-mpc-lib-v2

Install

- download and extract
- Server:
  - run "npm install" from inside the project directory to automatically install the dependencies listed in package.json:

- Client - Browser:
  - from the server, expose the client library in `/src/client.js`
  - include the library code in the webpage 
    ```html
     <script type="text/javascript" src="/src/client.js"></script>
     ```
  - init library 
    ```javascript
    var isimple_mpc.init_simple_mpc('localhost',$('#num_parties').val(), $('#comp_id').val(), $('#implem_type').val());
    ```
