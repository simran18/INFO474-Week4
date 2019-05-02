library(dplyr)
library(tidyr)
# load unprepped data and clean it

# load the fertility data 
fertility_data <- read.csv("fertility_rates.csv") 

# select the needed column names
new.fertility.data <- select(fertility_data, LOCATION, TIME, Value)

# rename the column names for ease
colnames(new.fertility.data) <- c("location", "time", "fertility_rate")

# load the life expectancy data, only select the total gender values and select the
# needed columns 
life_data <- read.csv("life_expectancy.csv") %>% 
             filter(SUBJECT == "TOT") %>% 
             select(LOCATION, TIME, Value)
# rename the column names for ease
colnames(life_data) <- c("location", "time", "life_expectancy")


# load the population data, only select the total gender values and the measure by million
# select the needed columns 
pop_data <- read.csv("population.csv") %>% 
            filter(MEASURE == "MLN_PER", SUBJECT == "TOT")  %>% 
            select(LOCATION, TIME, Value)
# rename the column names for ease
colnames(pop_data) <- c("location", "time", "pop_mlns")

# join the data sets by time and location
life.fertility.data <-  merge(new.fertility.data, life_data,by=c("location","time"))
total.data <- merge(life.fertility.data, pop_data, by=c("location", "time"))

# write the final data as csv
write.csv(total.data, "prepped_data.csv")
