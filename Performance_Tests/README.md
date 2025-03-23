# Performance tests

The file [performance_analysis.ipynb](./performance_analysis.ipynb) contains the 
performance tests that were conducted to analyze the average API response times 
of the both iterations.
The process of the analysis is also described in the file [performance_analysis.ipynb](./performance_analysis.ipynb)
in detail.
For every requirement, the average API response time was calculated by
measuring subtracting the start of every API request from the end of the API request.
This was done in every iteration for every requirement 30 times.
Afterwards, the minimal and maximal value was removed from the 30 measurements
and an average was calculated.
To create a reference basis for the two iterations, the initial requirements
for the first iteration were also implemented as Transact-SQL.
The implementation can be found [here](../TSQL_Requirements/requirements.sql).
As it is impossible to calculate the average response time of API requests in this case, the individual requests were implemented as stored procedures or user-defined functions.
When calculating the time, the start point of the execution was subtracted from the end point of the execution.