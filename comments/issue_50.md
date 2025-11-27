### Design Decision for Keeping Add-Category and Deactivate-Category Endpoints Separate

1. **Explicit State Management with Soft-Delete**:  
   We opted for a soft-delete approach in the `wardrobeCategory` table to manage the state of categories explicitly. This allows us to easily toggle categories between active and inactive without removing them from the database, preserving historical data and ensuring that category relationships remain intact.

2. **Contextual Validations for Each Operation**:  
   Keeping the endpoints separate allows for tailored validations appropriate to each operation. The `add-category` endpoint can enforce rules related to new category creation, while the `deactivate-category` endpoint can handle validations pertinent to existing categories, ensuring that each action adheres to the necessary business logic.

3. **Atomic Operations Without Partial Failures**:  
   By having distinct endpoints, we ensure that operations can be atomic. Each request stands alone, eliminating the risk of partial failures during category management. This means that if an operation fails, it does not compromise the integrity of other operations, leading to a more robust API behavior.

4. **Client Flexibility for Granular Changes**:  
   Clients benefit from having separate endpoints because they can make granular requests based on their specific needs. For instance, if a client needs to deactivate several categories, they can do so without needing to handle a complex payload that includes both adding and deactivating categories in one go.

5. **Option for Parallel Calls if Multiple Categories Need Updating**:  
   This design allows clients to make parallel API calls if they wish to update multiple categories simultaneously. Instead of batching operations into a single call that could fail or cause complications, clients can invoke separate endpoints concurrently, enhancing responsiveness and minimizing wait times.

The decision to keep these endpoints distinct ultimately aims to create a cleaner, more maintainable API that better serves client needs while adhering to sound design principles.